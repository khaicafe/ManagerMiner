// main.js (Main Process)
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const { exec } = require("child_process");
const fs = require("fs");
const configPath = path.join(__dirname, "miner.json");
const minerConfigPath = path.join(__dirname, "miner.json");
const xmrigConfigPath = path.join(__dirname, "xmrig", "config.json");

let mainWindow;
let minerProcess = null;
let showConsole = true; // ✅ mặc định là show

function setMinerName(minerName) {
  // Lưu miner_name riêng
  fs.writeFileSync(
    minerConfigPath,
    JSON.stringify({ miner_name: minerName }, null, 2)
  );
  console.log("✅ Miner name saved:", minerName);

  // Cập nhật config.json
  if (fs.existsSync(xmrigConfigPath)) {
    const config = JSON.parse(fs.readFileSync(xmrigConfigPath, "utf8"));
    const wallet = (config.pools?.[0]?.user || "").split(".")[0]; // lấy phần trước nếu có

    config.pools[0].user = `${wallet}.${minerName}`;
    fs.writeFileSync(xmrigConfigPath, JSON.stringify(config, null, 2));
    console.log("🔧 Updated XMRig config with new miner_name.");
  }
}

function setServerIP(ip) {
  const fullURL = `http://${ip}:8081/api/report`;

  let config = {};
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }

  config.server_url = fullURL;

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`💾 Server URL saved: ${fullURL}`);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  mainWindow.loadFile("index.html");
}

function startMiner() {
  if (minerProcess) {
    console.log("⛏ Miner already running");
    return;
  }

  const minerPath = path.join(__dirname, "xmrig", "xmrig");
  const configPath = path.join(__dirname, "config.json");

  const options = {
    cwd: path.join(__dirname, "xmrig"),
    detached: true,
    stdio: showConsole ? "inherit" : "ignore",
  };

  minerProcess = spawn(minerPath, ["-c", configPath], options);
  console.log("🚀 Miner started with PID:", minerProcess.pid);

  minerProcess.on("exit", (code) => {
    console.log("❌ Miner exited with code", code);
    minerProcess = null;
  });
}

function stopMiner() {
  if (minerProcess) {
    process.kill(-minerProcess.pid);
    console.log("🛑 Miner stopped");
    minerProcess = null;
  } else {
    console.log("ℹ️ Miner not running");
  }
}

app.whenReady().then(createWindow);

ipcMain.on("start-miner", () => {
  startMiner();
});

ipcMain.on("stop-miner", () => {
  stopMiner();
});

ipcMain.on("toggle-console", (_, flag) => {
  showConsole = flag;
});

// ipcMain.on("set-server-ip", (_, ip) => {
//   console.log("💾 Server IP set to:", ip);
//   setServerIP(ip);
// });

// ipcMain.on("set-miner-name", (event, name) => {
//   setMinerName(name);
// });

ipcMain.on("save-config", (event, { serverIp, minerName }) => {
  let config = {};

  if (fs.existsSync(minerConfigPath)) {
    const content = fs.readFileSync(minerConfigPath, "utf-8");
    config = JSON.parse(content);
  }

  // Chỉ update các trường được nhập, giữ nguyên các trường còn lại
  config.server_url = `http://${serverIp}:8081/api/report`;
  config.miner_name = minerName;

  if (serverIp != null) {
    fs.writeFileSync(minerConfigPath, JSON.stringify(config, null, 2));
    console.log("✅ Updated config.json");
  }

  // Cập nhật config.json
  if (fs.existsSync(xmrigConfigPath)) {
    const config = JSON.parse(fs.readFileSync(xmrigConfigPath, "utf8"));
    const wallet = (config.pools?.[0]?.user || "").split(".")[0]; // lấy phần trước nếu có

    config.pools[0].user = `${wallet}.${minerName}`;
    fs.writeFileSync(xmrigConfigPath, JSON.stringify(config, null, 2));
    console.log("🔧 Updated XMRig config with new miner_name.");
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
