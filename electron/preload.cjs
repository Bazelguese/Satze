const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveCropConfig: (payload) => ipcRenderer.invoke('save-crop-config', payload),
  quitApp: () => ipcRenderer.invoke('satze:app:quit'),
  getMultiplayerConfig: () => ipcRenderer.invoke('satze:getMultiplayerConfig'),
  display: {
    getDisplays: () => ipcRenderer.invoke('satze:display:getDisplays'),
    getState: () => ipcRenderer.invoke('satze:display:getState'),
    apply: (payload) => ipcRenderer.invoke('satze:display:apply', payload),
    getSaved: () => ipcRenderer.invoke('satze:display:getSaved'),
  },
});
