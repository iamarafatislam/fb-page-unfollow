const FB_URL = "https://www.facebook.com/";
const GRAPHQL_URL = "https://www.facebook.com/api/graphql/";
const CONTACT_FALLBACK_URL = "https://www.facebook.com/help/contact/1417759018475333?helpref=faq_content&refid=69";

let cachedSession = null;
let lastSessionTime = 0;
const SESSION_CACHE_MS = 15 * 60 * 1000;

// Open side panel on extension icon click
chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true }).catch(() => {});
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.windowId != null) {
    chrome.sidePanel?.open?.({ windowId: tab.windowId }).catch(() => {});
  }
});

// Configure DNR rule to ensure referer/origin match facebook.com for background graphql requests
async function setupDnrRules() {
  const RULE_ID = 101;
  try {
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [RULE_ID],
      addRules: [
        {
          id: RULE_ID,
          priority: 1,
          action: {
            type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
            requestHeaders: [
              { header: "origin", operation: chrome.declarativeNetRequest.HeaderOperation.SET, value: "https://www.facebook.com" },
              { header: "referer", operation: chrome.declarativeNetRequest.HeaderOperation.SET, value: "https://www.facebook.com/" }
            ]
          },
          condition: {
            urlFilter: "||facebook.com/api/graphql/",
            resourceTypes: [chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST],
            tabIds: [-1]
          }
        }
      ]
    });
  } catch (err) {
    console.warn("DNR rule registration error:", err);
  }
}
setupDnrRules();

async function getUserId() {
  try {
    const cookie = await chrome.cookies.get({ url: FB_URL, name: "c_user" });
    return cookie?.value || null;
  } catch {
    return null;
  }
}

async function extractTokenFromTabs() {
  try {
    const tabs = await chrome.tabs.query({ url: "*://*.facebook.com/*" });
    if (!tabs || tabs.length === 0) return null;

    return await Promise.any(
      tabs.map((tab) =>
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          world: "MAIN",
          func: () => {
            try {
              const req = globalThis.require;
              return (typeof req === "function" ? req("DTSGInitialData") : null)?.token ?? null;
            } catch {
              return null;
            }
          }
        }).then((res) => {
          const val = res[0]?.result;
          if (typeof val === "string" && val) return val;
          throw new Error("Token not found");
        })
      )
    );
  } catch {
    return null;
  }
}

async function extractTokenFromContactPage() {
  try {
    const res = await fetch(CONTACT_FALLBACK_URL, { credentials: "include" });
    const text = await res.text();
    const match = text.match(/name="fb_dtsg"\s+value="([^"]+)"/) || text.match(/"DTSGInitialData",\[\],\{"token":"([^"]+)"/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function getSession() {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("not_logged_in: Please log into Facebook first.");
  }

  if (cachedSession && cachedSession.userId === userId && Date.now() - lastSessionTime < SESSION_CACHE_MS) {
    return cachedSession;
  }

  const dtsg = (await extractTokenFromTabs()) || (await extractTokenFromContactPage());
  if (!dtsg) {
    throw new Error("missing_dtsg: Could not retrieve FB security token. Open Facebook in an active tab and try again.");
  }

  cachedSession = { userId, dtsg };
  lastSessionTime = Date.now();
  return cachedSession;
}

function parseFbResponse(raw) {
  let text = raw;
  if (text.startsWith("for (;;);")) {
    text = text.slice(9);
  }
  return JSON.parse(text.split("\n")[0]);
}

function findConnection(data) {
  let found = null;
  const visited = new Set();
  function traverse(obj) {
    if (!obj || typeof obj !== "object" || visited.has(obj) || found) return;
    visited.add(obj);
    if (Array.isArray(obj.edges) && obj.page_info) {
      found = obj;
      return;
    }
    for (const key of Object.keys(obj)) {
      traverse(obj[key]);
    }
  }
  traverse(data);
  return found;
}

// Handler for loading pages
async function loadPages(cursor = null, limit = 30) {
  const session = await getSession();
  const friendlyName = "PagesCometAllLikedPagesSectionPaginationQuery";
  const docId = "26116713214697233";

  const variables = {
    count: limit,
    cursor: cursor,
    ranking_model: "INTEGRITY_SIGNALS",
    scale: 2,
    id: session.userId,
    __relay_internal__pv__StoriesRingrelayprovider: false
  };

  const body = new URLSearchParams({
    av: session.userId,
    __user: session.userId,
    __a: "1",
    fb_dtsg: session.dtsg,
    fb_api_caller_class: "RelayModern",
    fb_api_req_friendly_name: friendlyName,
    variables: JSON.stringify(variables),
    server_timestamps: "true",
    doc_id: docId
  });

  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "x-fb-friendly-name": friendlyName
    },
    body: body.toString()
  });

  const rawText = await response.text();
  const parsed = parseFbResponse(rawText);

  if (parsed.errors && parsed.errors.length) {
    throw new Error(parsed.errors[0]?.message || "GraphQL error occurred");
  }

  const connection = findConnection(parsed.data);
  if (!connection) {
    return { items: [], hasNext: false, endCursor: null };
  }

  const items = (connection.edges || []).map((e) => {
    const node = e.node || {};
    return {
      id: node.id,
      name: node.name,
      url: node.url,
      avatar: node.profile_picture?.uri || null
    };
  }).filter((i) => i.id && i.name);

  const pageInfo = connection.page_info || {};
  return {
    items,
    endCursor: pageInfo.end_cursor || null,
    hasNext: Boolean(pageInfo.has_next_page && pageInfo.end_cursor)
  };
}

// Handler for unfollowing a single page
async function unfollowPage(pageId) {
  const session = await getSession();
  const friendlyName = "CometUserUnfollowMutation";
  const docId = "26828219736856793";

  const variables = {
    action_render_location: "WWW_COMET_FOLLOWING_MENU",
    input: {
      is_tracking_encrypted: false,
      subscribe_location: "PROFILE",
      tracking: null,
      unsubscribee_id: pageId,
      actor_id: session.userId,
      client_mutation_id: "1"
    },
    scale: 2
  };

  const body = new URLSearchParams({
    av: session.userId,
    __user: session.userId,
    __a: "1",
    fb_dtsg: session.dtsg,
    fb_api_caller_class: "RelayModern",
    fb_api_req_friendly_name: friendlyName,
    variables: JSON.stringify(variables),
    server_timestamps: "true",
    doc_id: docId
  });

  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "x-fb-friendly-name": friendlyName
    },
    body: body.toString()
  });

  const rawText = await response.text();
  const parsed = parseFbResponse(rawText);

  if (parsed.errors && parsed.errors.length) {
    return { success: false, error: parsed.errors[0]?.message || "GraphQL mutation error" };
  }

  const unsubscribee = parsed.data?.actor_unsubscribe?.unsubscribee;
  return {
    success: Boolean(unsubscribee),
    message: unsubscribee ? "Unfollowed" : "Unknown response"
  };
}

// Message Listener for UI
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "CHECK_LOGIN") {
    getUserId().then((id) => sendResponse({ loggedIn: Boolean(id), userId: id }));
    return true;
  }

  if (msg.type === "LOAD_PAGES") {
    loadPages(msg.cursor)
      .then((res) => sendResponse({ ok: true, data: res }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (msg.type === "UNFOLLOW_PAGE") {
    unfollowPage(msg.pageId)
      .then((res) => sendResponse({ ok: true, data: res }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});
