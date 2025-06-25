function startMiner() {
  window.electronAPI.startMiner();
}

function stopMiner() {
  window.electronAPI.stopMiner();
}

function saveConfig() {
  const ip = document.getElementById("serverIp").value.trim();
  const name = document.getElementById("minerName").value.trim();

  if (!ip || !name) {
    alert("Please enter both Server IP and Miner Name.");
    return;
  }

  window.electronAPI.saveConfig({ serverIp: ip, minerName: name });
  alert("Config saved!");
}

document.getElementById("consoleToggle").addEventListener("change", (e) => {
  window.electronAPI.toggleConsole(e.target.checked);
});
