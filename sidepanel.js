// State
let pages = [];
let selectedIds = new Set();
let isRunning = false;
let stopRequested = false;

// DOM Elements
const statusDotEl = document.getElementById("statusDot");
const statusTextEl = document.getElementById("statusText");
const refreshBtn = document.getElementById("refreshBtn");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const filteredCountEl = document.getElementById("filteredCount");
const totalCountEl = document.getElementById("totalCount");
const speedSelect = document.getElementById("speedSelect");
const selectAllBtn = document.getElementById("selectAllBtn");
const skeletonLoadingEl = document.getElementById("skeletonLoading");
const emptyStateEl = document.getElementById("emptyState");
const emptyStateMsgEl = document.getElementById("emptyStateMsg");
const pageListEl = document.getElementById("pageList");
const actionBarEl = document.getElementById("actionBar");
const selCountNumberEl = document.getElementById("selCountNumber");
const unfollowBtn = document.getElementById("unfollowBtn");

// Progress elements
const listViewEl = document.getElementById("listView");
const progressViewEl = document.getElementById("progressView");
const progressPercentEl = document.getElementById("progressPercent");
const progressEtaEl = document.getElementById("progressEta");
const progressBarFillEl = document.getElementById("progressBarFill");
const npNameEl = document.getElementById("npName");
const statOkEl = document.getElementById("statOk");
const statFailEl = document.getElementById("statFail");
const stopBtn = document.getElementById("stopBtn");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Session Check
async function checkLogin() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "CHECK_LOGIN" }, (res) => {
      if (res?.loggedIn) {
        statusDotEl.className = "dot connected";
        statusTextEl.textContent = `Connected (User ID: ${res.userId})`;
        resolve(true);
      } else {
        statusDotEl.className = "dot disconnected";
        statusTextEl.textContent = "Not logged into Facebook";
        resolve(false);
      }
    });
  });
}

// Fetch Pages
async function fetchAllPages() {
  pages = [];
  selectedIds.clear();
  updateSelectionUI();
  renderPages();

  skeletonLoadingEl.classList.remove("hidden");
  emptyStateEl.classList.add("hidden");

  let cursor = null;
  let hasMore = true;

  try {
    while (hasMore) {
      const res = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "LOAD_PAGES", cursor }, resolve);
      });

      if (!res?.ok) {
        throw new Error(res?.error || "Failed to load pages");
      }

      const batch = res.data.items || [];
      const newItems = batch.filter((item) => !pages.some((p) => p.id === item.id));
      pages.push(...newItems);

      skeletonLoadingEl.classList.add("hidden");
      renderPages();

      cursor = res.data.endCursor;
      hasMore = Boolean(res.data.hasNext && cursor);

      if (hasMore) await sleep(400);
    }
  } catch (err) {
    statusDotEl.className = "dot disconnected";
    statusTextEl.textContent = `Error: ${err.message}`;
    skeletonLoadingEl.classList.add("hidden");
  } finally {
    skeletonLoadingEl.classList.add("hidden");
    if (pages.length === 0) {
      emptyStateEl.classList.remove("hidden");
    }
  }
}

// Render Pages List
function renderPages() {
  const query = searchInput.value.trim().toLowerCase();
  clearSearchBtn.classList.toggle("hidden", query.length === 0);

  const filtered = pages.filter((p) => p.name.toLowerCase().includes(query));

  filteredCountEl.textContent = filtered.length;
  totalCountEl.textContent = pages.length;
  pageListEl.innerHTML = "";

  if (filtered.length === 0 && pages.length > 0) {
    emptyStateEl.classList.remove("hidden");
    emptyStateMsgEl.textContent = "No pages matching your search.";
    return;
  } else if (pages.length > 0) {
    emptyStateEl.classList.add("hidden");
  }

  filtered.forEach((p) => {
    const li = document.createElement("li");
    const isSelected = selectedIds.has(p.id);
    li.className = `friend ${isSelected ? "selected" : ""} ${p.unfollowed ? "unfollowed" : ""}`;
    li.dataset.id = p.id;

    // Checkbox indicator
    const box = document.createElement("div");
    box.className = "box";
    box.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

    // Avatar
    const img = document.createElement("img");
    img.className = "avatar";
    img.src = p.avatar || "icons/icon-32.png";
    img.alt = "";

    // Info
    const info = document.createElement("div");
    info.className = "friend-info";

    const name = document.createElement("div");
    name.className = "friend-name";
    name.textContent = p.name;

    const handle = document.createElement("div");
    handle.className = "friend-handle";
    handle.textContent = p.url ? p.url.replace(/^https:\/\/(www\.)?facebook\.com\/?/, "") : `id: ${p.id}`;

    info.appendChild(name);
    info.appendChild(handle);

    li.appendChild(box);
    li.appendChild(img);
    li.appendChild(info);

    if (p.unfollowed) {
      const badge = document.createElement("span");
      badge.className = "rowstatus success";
      badge.textContent = "Unfollowed";
      li.appendChild(badge);
    }

    li.addEventListener("click", () => {
      if (isRunning || p.unfollowed) return;
      if (selectedIds.has(p.id)) {
        selectedIds.delete(p.id);
        li.classList.remove("selected");
      } else {
        selectedIds.add(p.id);
        li.classList.add("selected");
      }
      updateSelectionUI();
    });

    pageListEl.appendChild(li);
  });
}

function updateSelectionUI() {
  const count = selectedIds.size;
  selCountNumberEl.textContent = count;
  actionBarEl.classList.toggle("show", count > 0);

  const query = searchInput.value.trim().toLowerCase();
  const eligible = pages.filter((p) => !p.unfollowed && p.name.toLowerCase().includes(query));
  const allEligibleSelected = eligible.length > 0 && eligible.every((p) => selectedIds.has(p.id));

  selectAllBtn.textContent = allEligibleSelected ? "Deselect All" : "Select All";
}

// Select All Toggle
selectAllBtn.addEventListener("click", () => {
  if (isRunning) return;
  const query = searchInput.value.trim().toLowerCase();
  const eligible = pages.filter((p) => !p.unfollowed && p.name.toLowerCase().includes(query));
  const allEligibleSelected = eligible.length > 0 && eligible.every((p) => selectedIds.has(p.id));

  if (allEligibleSelected) {
    eligible.forEach((p) => selectedIds.delete(p.id));
  } else {
    eligible.forEach((p) => selectedIds.add(p.id));
  }

  updateSelectionUI();
  renderPages();
});

// Search & Refresh
searchInput.addEventListener("input", renderPages);
clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  renderPages();
});

refreshBtn.addEventListener("click", async () => {
  if (isRunning) return;
  await checkLogin();
  await fetchAllPages();
});

// Unfollow Execution
unfollowBtn.addEventListener("click", async () => {
  if (selectedIds.size === 0 || isRunning) return;

  const count = selectedIds.size;
  const confirmed = window.confirm(`Are you sure you want to unfollow ${count} selected Facebook pages?`);
  if (!confirmed) return;

  isRunning = true;
  stopRequested = false;

  // Switch to progress view
  listViewEl.classList.remove("active");
  progressViewEl.classList.add("active");
  stopBtn.disabled = false;
  stopBtn.textContent = "Stop Unfollowing";

  const targetIds = Array.from(selectedIds);
  const total = targetIds.length;
  let done = 0;
  let okCount = 0;
  let failCount = 0;
  const delayMs = parseInt(speedSelect.value, 10) || 2000;

  for (const pageId of targetIds) {
    if (stopRequested) break;

    const page = pages.find((p) => p.id === pageId);
    npNameEl.textContent = page?.name || pageId;

    const res = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "UNFOLLOW_PAGE", pageId }, resolve);
    });

    if (res?.ok && res.data?.success) {
      if (page) page.unfollowed = true;
      selectedIds.delete(pageId);
      okCount++;
      statOkEl.textContent = okCount;
    } else {
      failCount++;
      statFailEl.textContent = failCount;
    }

    done++;
    const pct = Math.round((done / total) * 100);
    progressBarFillEl.style.width = `${pct}%`;
    progressPercentEl.textContent = `${pct}%`;

    const remainingItems = total - done;
    const etaSec = Math.round((remainingItems * delayMs) / 1000);
    progressEtaEl.textContent = remainingItems > 0 ? `ETA ~${etaSec}s` : "Done";

    if (done < total && !stopRequested) {
      await sleep(delayMs);
    }
  }

  await sleep(1200);

  // Switch back to list view
  progressViewEl.classList.remove("active");
  listViewEl.classList.add("active");
  isRunning = false;

  updateSelectionUI();
  renderPages();
});

stopBtn.addEventListener("click", () => {
  stopRequested = true;
  stopBtn.textContent = "Stopping...";
  stopBtn.disabled = true;
});

// Init
(async function init() {
  await checkLogin();
  await fetchAllPages();
})();
