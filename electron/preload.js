const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectCoverFile: () => ipcRenderer.invoke('select-cover-file'),
  exportConfigFile: (data) => ipcRenderer.invoke('export-config-file', data),
  importConfigFile: () => ipcRenderer.invoke('import-config-file'),
});
