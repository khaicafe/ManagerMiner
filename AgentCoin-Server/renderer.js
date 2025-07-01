window.addEventListener("DOMContentLoaded", () => {
  const logBox = document.getElementById("log");
  const btnInstall = document.getElementById("install");
  const btnUninstall = document.getElementById("uninstall");
  const btnStart = document.getElementById("start");
  const btnStop = document.getElementById("stop");
  const btnDev = document.getElementById("dev");
  const statusLabel = document.getElementById("status");

  function appendLog(text) {
    logBox.value += text + "\n";
    logBox.scrollTop = logBox.scrollHeight;
  }

  async function refreshServiceStatus() {
    const status = await window.api.serviceStatus();
    console.log("Service status:", status);

    statusLabel.textContent = status.running
      ? "Running"
      : status.installed
      ? "Stopped"
      : "Not Installed";

    btnInstall.disabled = status.installed;
    btnUninstall.disabled = !status.installed;
    btnStart.disabled = !status.installed || status.running;
    btnStop.disabled = !status.installed || !status.running;
  }

  btnInstall.addEventListener("click", async () => {
    const output = await window.api.serviceAction("install");
    appendLog(output);
    refreshServiceStatus();
  });

  btnUninstall.addEventListener("click", async () => {
    const output = await window.api.serviceAction("uninstall");
    appendLog(output);
    refreshServiceStatus();
  });

  btnStart.addEventListener("click", async () => {
    const output = await window.api.serviceAction("start");
    appendLog(output);
    refreshServiceStatus();
  });

  btnStop.addEventListener("click", async () => {
    const output = await window.api.serviceAction("stop");
    appendLog(output);
    refreshServiceStatus();
  });

  btnDev.addEventListener("click", async () => {
    const output = await window.api.runDev();
    appendLog(output);
  });

  window.api.onLog(appendLog);

  refreshServiceStatus();
});
