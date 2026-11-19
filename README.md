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

## 📥 Download & Installation

### Option 1: Quick Download (Recommended)
1. **[👉 Download fb-page-unfollow.zip](https://github.com/iamarafatislam/fb-page-unfollow/raw/main/fb-page-unfollow.zip)** directly.
2. Extract the downloaded ZIP folder to your PC.

### Option 2: Clone or Download from GitHub
- Click the green **`<> Code`** button at the top of this repository and choose **Download ZIP**.
- Extract the ZIP.

---

### How to Load into Chrome:
1. Open Google Chrome and go to `chrome://extensions/`
2. Enable the **"Developer mode"** toggle in the top-right corner.
3. Click the **"Load unpacked"** button in the top-left corner.
4. Select the extracted folder (the one containing `manifest.json`).
5. Open [Facebook](https://www.facebook.com/) in any tab, then click the extension icon in your toolbar to start!

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
