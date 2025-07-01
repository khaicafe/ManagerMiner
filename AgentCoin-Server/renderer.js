window.addEventListener("DOMContentLoaded", () => {
  const logBox = document.getElementById("log");
  const btnInstall = document.getElementById("install");
  const btnUninstall = document.getElementById("uninstall");
  const btnStart = document.getElementById("start");
  const btnStop = document.getElementById("stop");
  const btnDev = document.getElementById("dev");

  function appendLog(text) {
    logBox.value += text + "\n";
    logBox.scrollTop = logBox.scrollHeight;
  }

  btnInstall.addEventListener("click", () => {
    window.api.serviceAction("install").then(appendLog);
  });

  btnUninstall.addEventListener("click", () => {
    window.api.serviceAction("uninstall").then(appendLog);
  });

  btnStart.addEventListener("click", () => {
    window.api.serviceAction("start").then(appendLog);
  });

  btnStop.addEventListener("click", () => {
    window.api.serviceAction("stop").then(appendLog);
  });

  btnDev.addEventListener("click", () => {
    window.api.runDev().then(appendLog);
  });

  window.api.onLog(appendLog);
});
