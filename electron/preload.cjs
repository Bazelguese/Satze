const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveCropConfig: (payload) => ipcRenderer.invoke('save-crop-config', payload),
  getMultiplayerConfig: () => ipcRenderer.invoke('satze:getMultiplayerConfig'),
});
