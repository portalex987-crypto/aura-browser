const { contextBridge, ipcRenderer } = require('electron');

const invoke = (ch, ...args) => ipcRenderer.invoke(ch, ...args);
const on     = (ch, fn) => ipcRenderer.on(ch, (_, ...args) => fn(...args));

contextBridge.exposeInMainWorld('api', {
  // Tab actions
  newTab:    url => invoke('tab:new', url),
  closeTab:  id  => invoke('tab:close', id),
  switchTab: id  => invoke('tab:switch', id),
  navigate:  url => invoke('tab:navigate', url),
  back:      ()  => invoke('tab:back'),
  forward:   ()  => invoke('tab:forward'),
  reload:    ()  => invoke('tab:reload'),
  stop:      ()  => invoke('tab:stop'),

  // Window controls
  minimize:  () => invoke('win:minimize'),
  maximize:  () => invoke('win:maximize'),
  close:     () => invoke('win:close'),
  openExt:   url => invoke('win:openExt', url),

  // Events from main → renderer
  onTabTitle:   fn => on('tab:title',   fn),
  onTabFavicon: fn => on('tab:favicon', fn),
  onTabLoading: fn => on('tab:loading', fn),
  onTabUrl:     fn => on('tab:url',     fn),
  onTabCanNav:  fn => on('tab:cannav',  fn),
  onTabOpened:  fn => on('tab:opened',  fn),
  onWinState:   fn => on('win:state',   fn),
});
