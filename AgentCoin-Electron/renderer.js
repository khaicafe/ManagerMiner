let showConsole = document.getElementById("consoleToggle").checked;
let status = "Stopped";

const logEl = document.getElementById("logOutput");
const statusText = document.getElementById("statusText");

document.getElementById("consoleToggle").addEventListener("change", (e) => {
  showConsole = e.target.checked;
  window.electronAPI.toggleConsole(showConsole);
  document.getElementById("logOutput").style.display = showConsole
    ? "block"
    : "none";
});

/**
 * Hàm loại bỏ mã màu ANSI
 */
function stripAnsi(str) {
  return str.replace(
    // regex xóa ANSI escape codes
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ""
  );
}

let logBuffer = "";
let logTimer = null;

const MAX_LOG_LINES = 5000;
let logLines = [];

/**
 * Lắng nghe log miner - chỉ cần setup 1 lần duy nhất
 */
window.electronAPI.onMinerLogUpdate((data) => {
  // ❌ data chứa mã màu
  // ✅ Strip ANSI
  const clean = stripAnsi(data);

  // Giới hạn độ dài 1 log
  const MAX_LINE_LENGTH = 1000;
  let line = clean;
  if (line.length > MAX_LINE_LENGTH) {
    line = line.slice(0, MAX_LINE_LENGTH) + "...(truncated)";
  }

  logBuffer += line;

  // logic batching sự kiện onMinerLogUpdate bắn liên tục, UI chỉ render mỗi ~300ms một lần
  if (!logTimer) {
    logTimer = setTimeout(() => {
      logLines.push(logBuffer);
      if (logLines.length > MAX_LOG_LINES) {
        logLines.shift();
      }

      // Chỉ hiển thị 1000 dòng cuối
      const visibleLog = logLines.slice(-1000).join("");
      logEl.textContent = visibleLog;
      logEl.scrollTop = logEl.scrollHeight;

      logBuffer = "";
      logTimer = null;
    }, 300);
  }
});

function startMiner() {
  // window.electronAPI.startMiner();
  console.log("✅ Miner started");

  logBuffer = ""; // 🧹 clear log mỗi lần start mới
  logEl.innerText = "";
  statusText.innerText = "Starting...";

  window.electronAPI
    .startMiner(showConsole)
    .then((res) => {
      console.log("✅ Miner started. PID:", res?.pid);
    })
    .catch((err) => {
      console.error("❌ Failed to start miner:", err);
      alert("Failed to start miner: " + err.message);
    });
}

function stopMiner() {
  // window.electronAPI.stopMiner();
  statusText.innerText = "Stopped";
  window.electronAPI.stopMiner().then((res) => {
    logBuffer += "\n⛔ Miner stopped.\n";
    document.getElementById("logOutput").innerText = logBuffer;
  });
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

// main js truyền giá trị cho miningSpeed
window.electronAPI.onMaxThreadsHint((hint) => {
  // Gán giá trị vào span
  document.getElementById("miningSpeedValue").textContent = hint;

  // Đồng thời set giá trị vào slider
  document.getElementById("miningSpeed").value = hint;
});

window.electronAPI.onStatusStartStop((hint) => {
  // Gán giá trị vào span
  statusText.innerText = hint;
});

// get info about
window.electronAPI.onAboutInfoLoaded((about) => {
  console.log("🎉 ABOUT INFO:", about);
  renderAboutTable(about);
});

function renderAboutTable(info) {
  const table = document.getElementById("aboutTable");
  table.innerHTML = "";

  for (const [key, value] of Object.entries(info)) {
    const row = document.createElement("tr");

    const tdKey = document.createElement("td");
    tdKey.textContent = key;
    tdKey.style.fontWeight = "bold";

    const tdVal = document.createElement("td");
    if (value.includes("\n")) {
      value.split("\n").forEach((line) => {
        const div = document.createElement("div");
        div.textContent = line;
        tdVal.appendChild(div);
      });
    } else {
      tdVal.textContent = value;
    }

    row.appendChild(tdKey);
    row.appendChild(tdVal);
    table.appendChild(row);
  }
}

function loadMinerInfo() {
  window.electronAPI.getMinerInfo().then((info) => {
    document.getElementById("infoName").innerText = info?.name || "";
    document.getElementById("deviceID").innerText = info?.deviceID || "";
    document.getElementById("infoIP").innerText = info?.ip || "";
    document.getElementById("infoHashrate").innerText =
      info?.hashrate?.toFixed(2) + " H/s" || "";
    document.getElementById("threads").innerText =
      info?.threads?.toFixed(2) + " core" || "";
    document.getElementById("infoTemp").innerText =
      info?.temperature?.toFixed(1) + "°C" || "";
    document.getElementById("infoUptime").innerText = info?.uptime || "";
    document.getElementById("infoPlatform").innerText = info?.platform || "";
    document.getElementById("infoLog").innerText = info?.last_log || "";
    document.getElementById("infoCPU").innerText = info?.cpu_model || "";
    document.getElementById("infoCPUUsage").innerText =
      info?.cpu_usage?.toFixed(2) + "%" || "";
  });
}

function formatUptime(seconds) {
  if (!seconds) return "";
  let h = Math.floor(seconds / 3600);
  let m = Math.floor((seconds % 3600) / 60);
  let s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}
async function loadConfig() {
  const config = await window.electronAPI.loadMinerConfig();
  console.log("Loaded config:", config);
  // Dùng URL class để tách IP
  let ipOnly = "";
  try {
    const urlObj = new URL(config.server_url);
    ipOnly = urlObj.hostname;
  } catch (e) {
    console.error("Invalid URL in miner.json:", e);
  }

  document.getElementById("serverIp").value = ipOnly;
  document.getElementById("minerName").value = config.miner_name;
}

// thanh kéo speed miner
const miningSpeed = document.getElementById("miningSpeed");
const miningSpeedValue = document.getElementById("miningSpeedValue");

miningSpeed.addEventListener("input", (e) => {
  miningSpeedValue.textContent = e.target.value;
});

async function loadSpeedMiner() {
  // Load giá trị từ config
  const hint = await window.electronAPI.getMaxThreadsHint();
  miningSpeed.value = hint;
  miningSpeedValue.textContent = hint;

  miningSpeed.addEventListener("input", (e) => {
    miningSpeedValue.textContent = e.target.value;
  });

  miningSpeed.addEventListener("change", (e) => {
    const hint = parseInt(e.target.value, 10);
    window.electronAPI.saveMaxThreadsHint(hint);
  });
}
// Khi load xong trang -> load thông tin miner
window.addEventListener("DOMContentLoaded", async () => {
  loadMinerInfo();
  setInterval(loadMinerInfo, 60 * 1000);
  loadConfig();
  loadSpeedMiner();
});
