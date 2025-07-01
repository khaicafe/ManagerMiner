const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  serviceAction: (action) => ipcRenderer.invoke("service-action", action),
  runDev: () => ipcRenderer.invoke("run-dev"),
  onLog: (callback) => ipcRenderer.on("log", (event, data) => callback(data)),
});
