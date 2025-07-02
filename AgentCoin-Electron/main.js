// main.js (Main Process)

const { Tray, Menu, app, BrowserWindow, ipcMain } = require("electron");
const socketModule = require("./src/services/socket");
const path = require("path");
const { spawn, exec, execSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const minerConfig = require("./src/services/minerConfig.js");
const { logToFile } = require("./src/services/main-log.js");

const isDev = !app.isPackaged;

// const configPath = path.join(__dirname, "miner.json");
// const minerConfigPath = path.join(__dirname, "miner.json");

let minerConfigPath, configPath;

if (isDev) {
  // chạy dev → file nằm cạnh main.js
  minerConfigPath = path.join(__dirname, "miner.json");
} else {
  // chạy build → file để ngoài app.asar
  const userDataPath = app.getPath("userData");
  minerConfigPath = path.join(userDataPath, "miner.json");

  // Nếu file chưa tồn tại → copy từ resources (trong asar) ra
  const defaultConfigPath = path.join(process.resourcesPath, "miner.json");
  if (!fs.existsSync(minerConfigPath)) {
    if (fs.existsSync(defaultConfigPath)) {
      fs.copyFileSync(defaultConfigPath, minerConfigPath);
      console.log("✅ Copied default miner.json to userData folder.");
    } else {
      console.log("⚠️ No default miner.json found in resources!");
    }
  }
}
configPath = minerConfigPath;

const minerExe =
  os.platform() === "win32"
    ? "xmrigWin.exe"
    : os.platform() === "darwin"
    ? "xmrigMac"
    : "xmrigLinux";

const minerPath = isDev
  ? path.join(__dirname, "xmrig", minerExe)
  : path.join(process.resourcesPath, "xmrig", minerExe);

const xmrigConfigPath = isDev
  ? path.join(__dirname, "xmrig", "config.json")
  : path.join(process.resourcesPath, "xmrig", "config.json");

const logPath = isDev
  ? path.join(__dirname, "xmrig", "xmrig.log")
  : path.join(process.resourcesPath, "xmrig", "xmrig.log");

const {
  reportMinerStatus,
  getMinerConfig,
  updateMaxHint,
} = require("./src/services/minerService");

let mainWindow;
let minerProcess = null;
let showConsole = true;
let minerLog = "";
let minerStatus = "Stopped";
let minerStdout = null;
let aboutInfoCache = null;

let wallet = minerConfig.getWallet();
let pool = minerConfig.getPool();

console.log("Current wallet:", wallet);
console.log("Current pool:", pool);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function killXmrigProcesses() {
  const platform = os.platform();

  let cmd = "";
  if (platform === "win32") {
    cmd = "taskkill /F /IM xmrig.exe";
    exec(cmd, () => {});
    cmd = "taskkill /F /IM xmrigWin.exe";
  } else {
    cmd = "pkill -f xmrigMac";
  }

  exec(cmd, (error) => {
    if (error) {
      console.error(`⚠️ Error killing xmrig: ${error.message}`);
      return;
    }
    console.log(`✅ Killed xmrig processes`);
  });
  minerStatus = "Running";
}
killXmrigProcesses();

function clearLog() {
  if (fs.existsSync(logPath)) {
    fs.unlinkSync(logPath);
    console.log("🗑️ xmrig.log deleted at startup.");
  }
}
clearLog();

async function restMiner() {
  clearLog();
  killXmrigProcesses();
  if (minerStatus == "Running") {
    await sleep(5000);
    startMiner();
  }
}

function getDeviceUUID() {
  const platform = os.platform();
  try {
    let cmd = "";
    let output = "";
    if (platform === "darwin") {
      cmd = `ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID | awk -F'"' '{print $4}'`;
      output = execSync(cmd).toString().trim();
    } else if (platform === "linux") {
      output = execSync("cat /sys/class/dmi/id/product_uuid").toString().trim();
    } else if (platform === "win32") {
      cmd = "wmic csproduct get uuid";
      const raw = execSync(cmd).toString().trim();
      const lines = raw.split("\n");
      if (lines.length >= 2) {
        output = lines[1].trim();
      }
    } else {
      output = "Unknown-Platform";
    }
    return output || "Unknown-UUID";
  } catch (e) {
    console.error("❌ Error fetching device UUID:", e.message);
    return "Unknown-UUID";
  }
}

function getPlatformInfo() {
  const platform = os.platform();
  const release = os.release();
  const arch = os.arch();
  let name = platform;
  if (platform === "darwin") name = "macOS";
  if (platform === "win32") name = "Windows";
  if (platform === "linux") name = "Linux";
  return `${name} ${release} (${arch})`;
}

function getCPUUsagePercent() {
  const start = os.cpus();
  const startIdle = start.reduce((acc, cpu) => acc + cpu.times.idle, 0);
  const startTotal = start.reduce(
    (acc, cpu) =>
      acc +
      cpu.times.user +
      cpu.times.nice +
      cpu.times.sys +
      cpu.times.irq +
      cpu.times.idle,
    0
  );

  return new Promise((resolve) => {
    setTimeout(() => {
      const end = os.cpus();
      const endIdle = end.reduce((acc, cpu) => acc + cpu.times.idle, 0);
      const endTotal = end.reduce(
        (acc, cpu) =>
          acc +
          cpu.times.user +
          cpu.times.nice +
          cpu.times.sys +
          cpu.times.irq +
          cpu.times.idle,
        0
      );

      const idleDiff = endIdle - startIdle;
      const totalDiff = endTotal - startTotal;
      const usage = 100 - (idleDiff / totalDiff) * 100;
      resolve(Math.round(usage * 10) / 10);
    }, 500);
  });
}

function extractLastLogLine() {
  if (!fs.existsSync(logPath)) {
    return "Log not found.";
  }

  try {
    const data = fs.readFileSync(logPath, "utf-8");
    const lines = data.trim().split("\n");

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.includes("accepted") || line.includes("stopped")) {
        return line;
      }
    }
    return lines[lines.length - 1] || "Log empty.";
  } catch (e) {
    console.log("❌ Error reading xmrig.log:", e.message);
    return "Error reading log.";
  }
}

function getLocalIPAddress() {
  const ifaces = os.networkInterfaces();
  for (const iface of Object.values(ifaces)) {
    for (const info of iface) {
      if (info.family === "IPv4" && !info.internal) {
        return info.address;
      }
    }
  }
  return "unknown";
}

async function getCPUTemperature() {
  try {
    if (process.platform === "darwin") {
      const output = execSync("osx-cpu-temp").toString().trim();
      const match = output.match(/([\d.]+)/);
      return match ? parseFloat(match[1]) : 0;
    }
    if (process.platform === "linux") {
      const out = execSync("sensors").toString();
      const match = out.match(/(?:Core|Package).+?\+([\d.]+)/);
      return match ? parseFloat(match[1]) : 0;
    }
    if (process.platform === "win32") {
      const out = execSync(
        `wmic /namespace:\\\\root\\wmi PATH MSAcpi_ThermalZoneTemperature get CurrentTemperature`
      ).toString();
      const match = out.match(/(\d+)/);
      if (match) {
        const kelvin = parseInt(match[1], 10) / 10;
        const celsius = kelvin - 273.15;
        return Math.round(celsius);
      }
    }
  } catch (e) {
    console.log("❌ Cannot get CPU temp:", e.message);
  }
  return 0;
}

function parseHashrateFromLog() {
  if (!fs.existsSync(logPath)) {
    console.log("⚠️ xmrig.log not found.");
    fs.writeFileSync(logPath, "");
    // return { timestamp: "", hashrate: 0, threads: null };
  }

  try {
    const data = fs.readFileSync(logPath, "utf8");
    const lines = data.trim().split("\n");

    let lastTimestamp = "";
    let hashrate = 0;
    let threads = null;

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      const tsMatch = line.match(/^\[(.*?)\]/);
      if (tsMatch && !lastTimestamp) {
        lastTimestamp = tsMatch[1];
      }
      if (line.includes("miner") && line.includes("speed")) {
        const match = line.match(/speed.*?([\d.]+)\s+(?:n\/a|H\/s)/i);
        if (match) {
          hashrate = parseFloat(match[1]);
        }
      }
      if (line.includes("init dataset algo")) {
        const threadMatch = line.match(/\((\d+)\s+threads\)/);
        if (threadMatch) {
          threads = parseInt(threadMatch[1], 10);
        }
      }
    }

    return {
      timestamp: lastTimestamp,
      hashrate,
      threads,
    };
  } catch (e) {
    console.error("❌ Error reading xmrig.log:", e);
    return { timestamp: "", hashrate: 0, threads: null };
  }
}

async function getMinerInfo() {
  try {
    let minerName = "";
    let serverUrl = "";
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      minerName = config.miner_name || "";
      serverUrl = config.server_url || "";
    }

    const about = aboutInfoCache || {};
    const cpuModel = about["CPU"] || "Unknown";
    const lastLog = extractLastLogLine();
    const temperature = await getCPUTemperature();
    const localIP = getLocalIPAddress();
    const cpuUsage = await getCPUUsagePercent();
    const { timestamp, hashrate, threads } = parseHashrateFromLog();
    const deviceID = getDeviceUUID();
    const wallet = minerConfig.getWallet();
    const pool = minerConfig.getPool();
    const [url, portStr] = pool.split(":");
    const port = parseInt(portStr, 10);
    const max_threads_hint = minerConfig.getMaxThreadsHint();

    const payload = {
      deviceID,
      status: true,
      name: minerName || "YourMinerName",
      ip: localIP,
      hashrate,
      threads,
      temperature,
      uptime: timestamp,
      platform: getPlatformInfo(),
      last_log: lastLog,
      cpu_model: cpuModel,
      cpu_usage: cpuUsage,
      is_mining: minerStatus,
      pool_url: url,
      pool_port: port,
      wallet_address: wallet,
      max_threads_hint,
    };

    logToFile(`🌐 getMinerInfo: ${JSON.stringify(payload, null, 2)}`);
    const res = await handleReport(payload);
    logToFile(`🌐 getMinerInfo: ${JSON.stringify(res, null, 2)}`);
    return payload;
  } catch (error) {
    logToFile(`🌐 getMinerInfo error: ${JSON.stringify(error, null, 2)}`);
  }
}

let retryTimer = null;
async function readAboutInfo() {
  if (!fs.existsSync(logPath)) {
    console.log("⚠️ xmrig.log NOT FOUND. Will retry in 1 minute.");
    if (!retryTimer) {
      retryTimer = setInterval(readAboutInfo, 10000);
    }
    return null;
  }

  try {
    const data = fs.readFileSync(logPath, "utf-8");
    const about = parseAboutBlock(data);
    aboutInfoCache = about;
    console.log("✅ xmrig.log found. Parsing complete.");

    if (mainWindow) {
      mainWindow.webContents.send("aboutInfoLoaded", about);
    }

    if (retryTimer) {
      clearInterval(retryTimer);
      retryTimer = null;
      console.log("✅ Stopped retry timer for xmrig.log");
    }

    return about;
  } catch (e) {
    console.error("❌ Error reading xmrig.log:", e);
    return null;
  }
}

function parseAboutBlock(log) {
  const lines = log.split("\n");
  let aboutLines = [];
  let inAbout = false;

  for (const line of lines) {
    if (line.includes("* ABOUT")) {
      inAbout = true;
    }
    if (inAbout) {
      aboutLines.push(line);
      if (line.includes("* MOTHERBOARD")) break;
    }
  }

  const result = {};
  let lastKey = null;
  for (let line of aboutLines) {
    let clean = line.replace(/^\s*\*?/, "").trim();
    if (clean === "") continue;

    const match = clean.match(/^([A-Z0-9 #]+)\s{2,}(.*)$/);
    if (match) {
      lastKey = match[1].trim();
      const value = match[2].trim();
      result[lastKey] = value;
    } else if (lastKey) {
      result[lastKey] += "\n" + clean;
    }
  }
  return result;
}

let tray = null;
// chỉ cho phép một phiên bản app Electron chạy cùng lúc
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, argv, workingDirectory) => {
    console.log("🪟 App already running, focusing existing window.");
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    // khởi động cùng Windows
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: true,
      path: process.execPath,
      args: [],
    });

    console.log("✅ Auto-start setting applied");
    createWindow();
    mainWindow.webContents.once("did-finish-load", () => {
      readAboutInfo();
    });
  });

  app.on("window-all-closed", () => {
    // Không thoát app hoàn toàn trên Windows
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    icon: path.join(__dirname, "icon.ico"),
    maximizable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile("index.html");

  // const icon = isDev
  //   ? path.join(__dirname, "icon.ico")
  //   : path.join(process.resourcesPath, "icon.ico");
  mainWindow.setIcon(path.join(__dirname, "icon.png"));

  // mainWindow.webContents.openDevTools();

  // Chặn sự kiện close → chỉ hide
  mainWindow.on("close", (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Tạo Tray icon
  tray = new Tray(path.join(__dirname, "icon.png"));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Hiện cửa sổ",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      },
    },
    {
      label: "Thoát",
      click: () => {
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);
  tray.setToolTip("AgentCoin Miner");
  tray.setContextMenu(contextMenu);

  tray.on("double-click", () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });
}

function startMiner() {
  console.log("▶️ [Main] startMiner() called");

  if (minerProcess) {
    console.log("⛏ Miner already running");
    return { status: "Running", pid: minerProcess.pid };
  }

  const options = {
    cwd: isDev
      ? path.join(__dirname, "xmrig")
      : path.join(process.resourcesPath, "xmrig"),
    detached: true,
    stdio: ["pipe", "pipe", "pipe"],
  };

  minerProcess = spawn(minerPath, ["-c", xmrigConfigPath], options);
  console.log("🚀 Miner started with PID:", minerProcess.pid);
  minerStatus = "Running";
  mainWindow.webContents.send("onStatusStartStop", minerStatus);

  if (showConsole) {
    minerProcess.stdout.setEncoding("utf8");
    minerProcess.stderr.setEncoding("utf8");

    minerProcess.stdout.on("data", (data) => {
      console.log("🟢 miner:", data);
      minerLog += data;
      if (mainWindow) {
        mainWindow.webContents.send("minerLogUpdate", data);
      }
    });

    minerProcess.stderr.on("data", (data) => {
      console.log("🔴 miner error:", data);
      minerLog += data;
      if (mainWindow) {
        mainWindow.webContents.send("minerLogUpdate", data);
      }
    });
  }

  minerProcess.on("exit", (code) => {
    console.log("❌ Miner exited with code", code);
    minerProcess = null;
    minerStatus = "Stopped";
    if (mainWindow) {
      mainWindow.webContents.send(
        "minerLogUpdate",
        `\n❌ Miner exited (code: ${code})\n`
      );
    }
  });

  return { status: minerStatus, pid: minerProcess.pid };
}

function stopMiner() {
  if (minerProcess) {
    killXmrigProcesses();
    console.log("🛑 Miner stopped");
    minerStatus = "Stopped";
    mainWindow.webContents.send("onStatusStartStop", minerStatus);
    minerProcess = null;
  } else {
    console.log("ℹ️ Miner not running");
  }
}

ipcMain.handle("get-miner-info", () => {
  return getMinerInfo();
});

ipcMain.handle("startMiner", () => {
  return startMiner();
});

ipcMain.on("stop-miner", () => {
  stopMiner();
});

ipcMain.handle("load-miner-config", async () => {
  const raw = fs.readFileSync(configPath, "utf-8");
  return JSON.parse(raw);
});

ipcMain.on("toggle-console", (_, flag) => {
  showConsole = flag;
});

ipcMain.on("save-config", (event, { serverIp, minerName }) => {
  let config = {};
  if (fs.existsSync(minerConfigPath)) {
    const content = fs.readFileSync(minerConfigPath, "utf-8");
    config = JSON.parse(content);
  }

  config.server_url = `http://${serverIp}:8080/api/report`;
  config.miner_name = minerName;

  if (serverIp != null) {
    fs.writeFileSync(minerConfigPath, JSON.stringify(config, null, 2));
    console.log("✅ Updated miner.json");
  }

  if (fs.existsSync(xmrigConfigPath)) {
    const xmrigConf = JSON.parse(fs.readFileSync(xmrigConfigPath, "utf8"));
    xmrigConf.pools[0].pass = `${minerName}`;
    fs.writeFileSync(xmrigConfigPath, JSON.stringify(xmrigConf, null, 2));
    console.log("🔧 Updated XMRig config with new miner_name.");
  }

  console.log("♻️ Restarting app...");

  app.relaunch();
  app.exit(0);
});

ipcMain.handle("getMinerStatus", () => {
  return { status: minerStatus };
});

ipcMain.handle("getMinerLog", () => {
  return minerLog;
});

ipcMain.handle("get-about-info", async () => {
  const about = await readAboutInfo();
  return about;
});

ipcMain.handle("get-max-threads-hint", () => {
  const raw = fs.readFileSync(xmrigConfigPath, "utf-8");
  const config = JSON.parse(raw);
  return config.cpu?.["max-threads-hint"] ?? 0;
});

ipcMain.handle("save-max-threads-hint", async (_, hint) => {
  const raw = fs.readFileSync(xmrigConfigPath, "utf-8");
  const config = JSON.parse(raw);
  if (!config.cpu) config.cpu = {};
  config.cpu["max-threads-hint"] = hint;
  fs.writeFileSync(xmrigConfigPath, JSON.stringify(config, null, 2), "utf-8");

  const deviceID = getDeviceUUID();
  const payload = {
    deviceID,
    max_threads_hint: hint,
  };

  try {
    await updateMaxHint(payload);
  } catch (error) {
    console.log("check post", error);
  }

  restMiner();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

socketModule.initSocket(() => {
  console.log("Socket connected in main process");
  socketModule.sendNotification({
    message: "Hello from Electron!",
  });

  socketModule.on("notification", async (data) => {
    switch (data.content) {
      case "start_miner":
        console.log("⚡️ Server muốn start miner:", data);
        startMiner();
        break;
      case "stop_miner":
        console.log("⚡️ Server muốn stop miner:", data);
        stopMiner();
        break;
      case "update_config":
        console.log("⚡️ Server muốn set_miner_config:", data);
        const deviceID = getDeviceUUID();
        try {
          const res = await getMinerConfig(deviceID);
          mainWindow.webContents.send(
            "max-threads-hint",
            res.max_threads_hint_config
          );
          minerConfig.setMinerConfig({
            wallet: res.wallet_address_config,
            pool: res.pool_url_config + ":" + res.pool_port_config,
            threadsHint: res.max_threads_hint_config,
          });
          restMiner();
        } catch (error) {
          console.log("error", error);
        }
        break;
      default:
        console.log("⚠️ Unknown command:", data.content);
        break;
    }
  });
});

const handleReport = async (payload) => {
  try {
    const response = await reportMinerStatus(payload);
    console.log("Report response:", response);
    logToFile(`🌐 Report: ${JSON.stringify(response, null, 2)}`);
  } catch (error) {
    console.error("Failed to report miner status", error);
    logToFile(`🌐 Report error: ${JSON.stringify(error, null, 2)}`);
  }
};
