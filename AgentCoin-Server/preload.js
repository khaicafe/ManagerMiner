const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  serviceAction: (action) => ipcRenderer.invoke("service-action", action),

  serviceStatus: () => ipcRenderer.invoke("service-status"),

  runDev: () => ipcRenderer.invoke("run-dev"),

  onLog: (callback) => {
    ipcRenderer.on("log", (_, data) => {
      callback(data);
    });
  },
});
