# 🌌 Aura Browser

A barebones, native Windows web browser built with [Electron](https://www.electronjs.org/). Each tab is a real, isolated Chromium `WebContentsView` — not an iframe — so every website loads without restrictions.

![Electron](https://img.shields.io/badge/Electron-31-47848F?logo=electron&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Windows-0078D4?logo=windows&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

| Feature | Details |
|---|---|
| **Multi-tab browsing** | Open, close, and switch between tabs — each is a separate Chromium process |
| **Smart omnibox** | Type a URL to navigate, type anything else to search (DuckDuckGo). Arrow-key suggestions. |
| **Back / Forward / Reload** | Backed by real Chromium history |
| **New tab page** | Animated gradient background, greeting, search bar, 8 speed dials |
| **window.open() hijacking** | External links that open new windows become tabs instead |
| **Bookmarks** | ☆ star in the nav bar, persisted via `localStorage` |
| **Frameless window** | Custom dark chrome with Windows-style min/max/close controls |
| **Drag to move** | Tab bar acts as the window drag region |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- npm

### Install & Run

```bash
git clone https://github.com/YOUR_USERNAME/aura-browser.git
cd aura-browser
npm install
npm start
```

---

## 📁 Project Structure

```
aura-browser/
├── main.js        # Electron main process — window, WebContentsView per tab, IPC
├── preload.js     # Context bridge — exposes safe window.api to the renderer
├── chrome.html    # Browser chrome UI — tab bar, nav bar, omnibox, bookmarks
├── newtab.html    # New tab page — search bar + speed dials
└── package.json
```

### Architecture

```
BrowserWindow
├── contentView (WebContentsView)  ← chrome.html (84px chrome strip)
│   ├── Tab 1 WebContentsView      ← real website, starts at y=84
│   ├── Tab 2 WebContentsView      (hidden)
│   └── Tab N WebContentsView      (hidden)
```

- The **chrome strip** (`chrome.html`) is rendered in the main `BrowserWindow` and takes up the top 84px (36px tab bar + 48px nav bar).
- Each tab is a `WebContentsView` child, positioned below the chrome strip.
- Only the active tab is visible (`setVisible(true)`); all others are hidden.
- IPC via `ipcMain.handle` / `ipcRenderer.invoke` bridges actions between the chrome UI and the main process.

---

## ⌨️ Keyboard Shortcuts (Omnibox)

| Key | Action |
|---|---|
| `Enter` | Navigate / search |
| `↑` / `↓` | Navigate suggestions |
| `Escape` | Dismiss omnibox |

---

## 🛠 Tech Stack

- **[Electron 31](https://www.electronjs.org/)** — Chromium + Node.js desktop shell
- **WebContentsView** — per-tab Chromium rendering (replaces deprecated `BrowserView`)
- **Vanilla HTML/CSS/JS** — zero frontend framework overhead
- **localStorage** — bookmark persistence

---

## 📝 Notes

- `WebContentsView` requires Electron 30+.
- The `2 high severity vulnerabilities` warning from `npm audit` is from Electron's bundled Chromium build tooling — not runtime code.
- To open DevTools for a tab: focus the browser, then the standard Electron shortcut `Ctrl+Shift+I` can be wired in `main.js`.

---

## License

MIT
