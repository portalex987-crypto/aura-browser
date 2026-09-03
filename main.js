const { app, BrowserWindow, WebContentsView, ipcMain, shell } = require('electron');
const path = require('path');

const CHROME_H = 84; // 36px tabs + 48px nav

let win;
const views = new Map(); // tabId -> WebContentsView
let activeId = null;
let counter = 0;

// ── Helpers ────────────────────────────────────────────────────────────────
function send(ch, ...args) {
  if (win && !win.isDestroyed()) win.webContents.send(ch, ...args);
}

function getTabBounds() {
  const [w, h] = win.getContentSize();
  return { x: 0, y: CHROME_H, width: w, height: Math.max(0, h - CHROME_H) };
}

// ── Tab management ─────────────────────────────────────────────────────────
function createTab(url) {
  const id = String(++counter);
  const view = new WebContentsView({
    webPreferences: { contextIsolation: true, nodeIntegration: false }
  });

  win.contentView.addChildView(view);
  view.setVisible(false);
  views.set(id, view);

  const wc = view.webContents;

  wc.on('page-title-updated', (_, t) => send('tab:title', id, t));
  wc.on('page-favicon-updated', (_, f) => send('tab:favicon', id, f[0] || null));
  wc.on('did-start-loading', () => send('tab:loading', id, true));
  wc.on('did-stop-loading', () => {
    send('tab:loading', id, false);
    send('tab:cannav', id, wc.canGoBack(), wc.canGoForward());
  });
  wc.on('did-navigate', (_, u) => {
    send('tab:url', id, u);
    send('tab:cannav', id, wc.canGoBack(), wc.canGoForward());
  });
  wc.on('did-navigate-in-page', (_, u, isMain) => {
    if (isMain) { send('tab:url', id, u); send('tab:cannav', id, wc.canGoBack(), wc.canGoForward()); }
  });

  // Handle window.open() — open as a new tab instead
  wc.setWindowOpenHandler(({ url: newUrl }) => {
    const nid = createTab(newUrl);
    activateTab(nid);
    send('tab:opened', nid, newUrl);
    return { action: 'deny' };
  });

  if (url) {
    wc.loadURL(url).catch(() => {});
  } else {
    wc.loadFile(path.join(__dirname, 'newtab.html')).catch(() => {});
  }

  return id;
}

function activateTab(id) {
  if (activeId && views.has(activeId)) views.get(activeId).setVisible(false);
  activeId = id;
  const view = views.get(id);
  if (!view) return;
  view.setBounds(getTabBounds());
  view.setVisible(true);
  const wc = view.webContents;
  const url = wc.getURL();
  send('tab:url', id, url);
  send('tab:cannav', id, wc.canGoBack(), wc.canGoForward());
}

function destroyTab(id) {
  const view = views.get(id);
  if (!view) return;
  win.contentView.removeChildView(view);
  view.webContents.close();
  views.delete(id);
}

// ── App bootstrap ──────────────────────────────────────────────────────────
app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 640,
    minHeight: 400,
    frame: false,
    backgroundColor: '#0e0e14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    }
  });

  win.loadFile('chrome.html');

  win.on('resize', () => {
    if (activeId && views.has(activeId)) {
      views.get(activeId).setBounds(getTabBounds());
    }
  });
  win.on('maximize',   () => send('win:state', 'maximized'));
  win.on('unmaximize', () => send('win:state', 'normal'));

  // ── IPC handlers ──────────────────────────────────────────────────────────
  ipcMain.handle('tab:new', (_, url) => {
    const id = createTab(url || null);
    activateTab(id);
    return id;
  });

  ipcMain.handle('tab:close',    (_, id) => destroyTab(id));
  ipcMain.handle('tab:switch',   (_, id) => activateTab(id));
  ipcMain.handle('tab:navigate', (_, url) => views.get(activeId)?.webContents.loadURL(url).catch(() => {}));
  ipcMain.handle('tab:back',     () => views.get(activeId)?.webContents.goBack());
  ipcMain.handle('tab:forward',  () => views.get(activeId)?.webContents.goForward());
  ipcMain.handle('tab:reload',   () => views.get(activeId)?.webContents.reload());
  ipcMain.handle('tab:stop',     () => views.get(activeId)?.webContents.stop());

  ipcMain.handle('win:minimize', () => win.minimize());
  ipcMain.handle('win:maximize', () => win.isMaximized() ? win.unmaximize() : win.maximize());
  ipcMain.handle('win:close',    () => win.close());
  ipcMain.handle('win:openExt',  (_, url) => shell.openExternal(url));
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
