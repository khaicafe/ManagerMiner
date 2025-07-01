const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // startMiner: () => ipcRenderer.send("start-miner"),
  startMiner: (showConsole) => ipcRenderer.invoke("startMiner", showConsole),
  stopMiner: () => ipcRenderer.send("stop-miner"),

  loadMinerConfig: () => ipcRenderer.invoke("load-miner-config"),
  saveConfig: (data) => ipcRenderer.send("save-config", data),

  toggleConsole: (show) => ipcRenderer.send("toggle-console", show),
  onMinerLogUpdate: (callback) =>
    ipcRenderer.on("minerLogUpdate", (_, data) => {
      callback(data);
    }),
  getMinerStatus: () => ipcRenderer.invoke("getMinerStatus"),
  getMinerLog: () => ipcRenderer.invoke("getMinerLog"),
  getMinerInfo: () => ipcRenderer.invoke("get-miner-info"),
  // getAboutInfo: () => ipcRenderer.invoke("get-about-info"),
  onAboutInfoLoaded: (callback) =>
    ipcRenderer.on("aboutInfoLoaded", (_, data) => callback(data)),

  getMaxThreadsHint: () => ipcRenderer.invoke("get-max-threads-hint"),
  saveMaxThreadsHint: (hint) =>
    ipcRenderer.invoke("save-max-threads-hint", hint),

  onMaxThreadsHint: (callback) =>
    ipcRenderer.on("max-threads-hint", (e, hint) => {
      callback(hint);
    }),
});
