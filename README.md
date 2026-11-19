# FB Page Unfollower 🚀

> A clean, lightweight Chrome extension to scan and bulk-unfollow Facebook pages at a safe, adjustable pace.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Manifest: V3](https://img.shields.io/badge/Manifest-V3-success.svg)
![Status: 100% Free](https://img.shields.io/badge/Price-Free%20%26%20Open%20Source-green.svg)

---

## ✨ Features

- **⚡ Fast Page Discovery**: Automatically detects your active Facebook login and paginates through all your liked & followed pages.
- **🎯 Bulk Selection**: Select all, clear selection, or manually pick individual pages.
- **🔍 Real-Time Filter**: Search through your pages instantly by name.
- **⏱️ Safe Pacing Delays**: Choose between **Ultra (1.2s)**, **Fast (2.0s)**, **Normal (3.5s)**, or **Safe (5.0s)** to respect Facebook's rate limits.
- **📊 Live Progress Tracking**: Real-time progress bar, live ETA countdown, and instant **Stop** button.
- **🔒 100% Private**: Runs entirely locally in your browser. Zero tracking, zero telemetry, and no external servers.

---

## 📥 Installation Guide

Since this is an open-source extension, you can install it directly into Google Chrome without the Chrome Web Store:

1. **Download the code:**
   - Click the green **Code** button at the top right of this repository and select **Download ZIP** (or clone the repository using `git clone`).
   - Extract the ZIP file anywhere on your computer.

2. **Open Extensions in Chrome:**
   - In Google Chrome, navigate to `chrome://extensions/` (or go to `Settings` > `Extensions`).

3. **Enable Developer Mode:**
   - Turn on the **Developer mode** toggle in the top-right corner.

4. **Load the Extension:**
   - Click the **"Load unpacked"** button in the top-left corner.
   - Select the folder containing `manifest.json`.

5. **Start Unfollowing:**
   - Make sure you are logged into [Facebook](https://www.facebook.com/) in any browser tab.
   - Click the **FB Page Unfollower** puzzle icon in your Chrome toolbar to open the side panel.

---

## 🛠️ Tech Stack & Architecture

- **Manifest V3** with Chrome Side Panel API (`chrome.sidePanel`)
- **Native GraphQL Integration**: Communicates directly with Facebook's Relay/Comet API endpoints.
- **Declarative Net Request**: Ensures local requests preserve authentic Facebook session headers.
- **Vanilla JavaScript & Modern CSS**: Zero heavy frameworks, zero bloated dependencies, ultra-fast performance.

---

## ⚠️ Disclaimer

This tool is created for personal feed management and educational purposes. It is an independent open-source project and is not affiliated with, endorsed by, or sponsored by Meta Platforms, Inc. or Facebook. Please use safe pacing settings to avoid triggering temporary action blocks on your account.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
