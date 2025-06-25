const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  startMiner: () => ipcRenderer.send("start-miner"),
  stopMiner: () => ipcRenderer.send("stop-miner"),
  saveConfig: (data) => ipcRenderer.send("save-config", data),
  toggleConsole: (show) => ipcRenderer.send("toggle-console", show),
});
