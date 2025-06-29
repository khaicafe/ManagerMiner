// main.js (Main Process)
const { app, BrowserWindow, ipcMain } = require("electron");
const socketModule = require("./src/services/socket");
const path = require("path");
const { spawn } = require("child_process");
const { exec } = require("child_process");
const fs = require("fs");
const { execSync } = require("child_process");
const configPath = path.join(__dirname, "miner.json");
const minerConfigPath = path.join(__dirname, "miner.json");
const xmrigConfigPath = path.join(__dirname, "xmrig", "config.json");
const logPath = path.join(__dirname, "xmrig", "xmrig.log");

const {
  reportMinerStatus,
  getMinerConfig,
} = require("./src/services/minerService");
const minerConfig = require("./src/services/minerConfig.js");

let mainWindow;
let minerProcess = null;
let showConsole = true; // ✅ mặc định là show
let minerLog = ""; // lưu log tạm để gửi lên UI
let minerStatus = "Stopped";
let minerStdout = null;
let aboutInfoCache = null;
const os = require("os");
let wallet = minerConfig.getWallet();
let pool = minerConfig.getPool();

///////////// config.json wallet /////////////
console.log("Current wallet:", wallet);
console.log("Current pool:", pool);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function killXmrigProcesses() {
  const platform = os.platform();

  let cmd = "";

  if (platform === "win32") {
    // Windows
    cmd = "taskkill /F /IM xmrig.exe";
  } else {
    // macOS hoặc Linux
    cmd = "pkill -f xmrig";
  }

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`⚠️ Error killing xmrig: ${error.message}`);
      return;
    }
    console.log(`✅ Killed xmrig processes`);
  });
}
// kill all xmrig
killXmrigProcesses();

function clearLog() {
  if (fs.existsSync(logPath)) {
    fs.unlinkSync(logPath);
    console.log("🗑️ xmrig.log deleted at startup.");
  }
}
// Xóa log khi app khởi động
clearLog();

async function restMiner() {
  clearLog();
  // kill all xmrig
  killXmrigProcesses();
  await sleep(5000); // Delay 5 giây
  startMiner();
}

function getDeviceUUID() {
  const platform = os.platform();

  try {
    let cmd = "";
    let output = "";

    if (platform === "darwin") {
      // macOS
      cmd = `ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID | awk -F'"' '{print $4}'`;
      output = execSync(cmd).toString().trim();
    } else if (platform === "linux") {
      // Linux
      output = execSync("cat /sys/class/dmi/id/product_uuid").toString().trim();
    } else if (platform === "win32") {
      // Windows
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
  const logPath = path.join(__dirname, "xmrig", "xmrig.log");

  if (!fs.existsSync(logPath)) {
    return "Log not found.";
  }

  try {
    const data = fs.readFileSync(logPath, "utf-8");
    const lines = data.trim().split("\n");

    // Duyệt ngược từ cuối file
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.includes("accepted") || line.includes("stopped")) {
        return line;
      }
    }

    // Nếu không tìm thấy log accepted hay stopped → trả về dòng cuối
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

function getCPUTemperature() {
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
    return { timestamp: "", hashrate: 0, threads: null };
  }

  try {
    const data = fs.readFileSync(logPath, "utf8");
    const lines = data.trim().split("\n");

    let lastTimestamp = "";
    let hashrate = 0;
    let threads = null;

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];

      // Tìm timestamp
      const tsMatch = line.match(/^\[(.*?)\]/);
      if (tsMatch && !lastTimestamp) {
        lastTimestamp = tsMatch[1];
        // console.log("lastTimestamp", lastTimestamp);
      }

      // Tìm hashrate ở dòng speed
      if (line.includes("miner") && line.includes("speed")) {
        const match = line.match(/speed.*?([\d.]+)\s+(?:n\/a|H\/s)/i);
        if (match) {
          hashrate = parseFloat(match[1]);
          // Không break ở đây, vì muốn tiếp tục tìm threads
          // break; // bỏ break, vì cần parse tiếp threads
        }
      }

      // Tìm số threads thật sự
      if (line.includes("init dataset algo")) {
        // Ví dụ:
        // [2025-06-28 18:43:06.720]  cpu      init dataset algo rx/0 (8 threads)
        const threadMatch = line.match(/\((\d+)\s+threads\)/);
        console.log("line", line);
        if (threadMatch) {
          threads = parseInt(threadMatch[1], 10);
          // không cần break vì muốn chắc chắn lấy cả timestamp, hashrate, threads
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
  const configPath = path.join(__dirname, "miner.json");

  let minerName = "";
  let serverUrl = "";
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    minerName = config.miner_name || "";
    serverUrl = config.server_url || "";
  }

  // --- Lấy dữ liệu từ aboutInfoCache nếu có ---
  const about = aboutInfoCache || {};
  const cpuModel = about["CPU"] || "Unknown";
  const lastLog = extractLastLogLine();

  const temperature = getCPUTemperature();
  const localIP = getLocalIPAddress();
  const cpuUsage = await getCPUUsagePercent();
  const { timestamp, hashrate, threads } = parseHashrateFromLog();
  const deviceID = getDeviceUUID();
  const wallet = minerConfig.getWallet();
  const pool = minerConfig.getPool();
  const [url, portStr] = pool.split(":");
  const port = parseInt(portStr, 10);
  const max_threads_hint = minerConfig.getMaxThreadsHint();

  console.log("timestamp", pool, wallet);

  const payload = {
    deviceID,
    name: minerName || "YourMinerName",
    ip: localIP,
    hashrate: hashrate,
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
  // console.log("handleReport", payload);
  handleReport(payload);
  return payload;
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
    // Gửi về Renderer để render ngay
    if (mainWindow) {
      mainWindow.webContents.send("aboutInfoLoaded", about);
    }

    // Ngừng retry vì đã có log
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
    // Loại bỏ dấu *
    let clean = line.replace(/^\s*\*?/, "").trim();
    if (clean === "") continue;

    // Kiểm tra nếu bắt đầu bằng KEY
    const match = clean.match(/^([A-Z0-9 #]+)\s{2,}(.*)$/);
    if (match) {
      lastKey = match[1].trim();
      const value = match[2].trim();
      result[lastKey] = value;
    } else if (lastKey) {
      // Dòng tiếp theo -> append vào key trước đó
      result[lastKey] += "\n" + clean;
    }
  }

  return result;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  mainWindow.loadFile("index.html");
}

function startMiner(consoleFlag) {
  console.log("▶️ [Main] startMiner() called");

  if (minerProcess) {
    console.log("⛏ Miner already running");
    return { status: "Running", pid: minerProcess.pid };
  }

  const minerPath = path.join(__dirname, "xmrig", "xmrig");
  const configFile = path.join(__dirname, "miner.json");

  const options = {
    cwd: path.join(__dirname, "xmrig"),
    detached: true,
    // stdio: !showConsole ? "inherit" : ["pipe", "pipe", "pipe"],
    stdio: ["pipe", "pipe", "pipe"],
  };

  minerProcess = spawn(minerPath, ["-c", configFile], options);
  console.log("🚀 Miner started with PID:", minerProcess.pid);
  minerStatus = "Running";

  // console.log("showConsole", showConsole);

  if (showConsole) {
    minerProcess.stdout.setEncoding("utf8");
    minerProcess.stderr.setEncoding("utf8");

    minerProcess.stdout.on("data", (data) => {
      console.log("🟢 miner:", data);
      // mainWindow.webContents.send(
      //   "minerLogUpdate",
      //   `\n🟢 miner Start ${data}\n`
      // );
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
    process.kill(-minerProcess.pid);
    console.log("🛑 Miner stopped");
    minerStatus = "Stopped";
    minerProcess = null;
  } else {
    console.log("ℹ️ Miner not running");
  }
  // kill all
  killXmrigProcesses();
}

app.whenReady().then(() => {
  createWindow();

  mainWindow.webContents.once("did-finish-load", () => {
    readAboutInfo();
  });
});

ipcMain.handle("get-miner-info", () => {
  return getMinerInfo();
});

// ✅ Dùng ipcMain.handle để trả về promise
ipcMain.handle("startMiner", (event, showConsole) => {
  console.log("▶️ [Main] IPC startMiner called. showConsole =", showConsole);
  return startMiner(event, showConsole);
});

// ipcMain.on("start-miner", () => {
//   startMiner();
// });

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

// ✅ Thêm API lấy status
ipcMain.handle("getMinerStatus", () => {
  return { status: minerStatus };
});

// ✅ Thêm API lấy miner log
ipcMain.handle("getMinerLog", () => {
  return minerLog;
});

ipcMain.handle("get-about-info", async () => {
  const about = await readAboutInfo();
  return about;
});

// IPC handler: get max-threads-hint
ipcMain.handle("get-max-threads-hint", () => {
  const xmrigPath = path.join(__dirname, "xmrig", "config.json");
  const raw = fs.readFileSync(xmrigPath, "utf-8");
  const config = JSON.parse(raw);
  return config.cpu?.["max-threads-hint"] ?? 50;
});

// IPC handler: save max-threads-hint
ipcMain.handle("save-max-threads-hint", (event, hint) => {
  const xmrigPath = path.join(__dirname, "xmrig", "config.json");
  const raw = fs.readFileSync(xmrigPath, "utf-8");
  const config = JSON.parse(raw);

  if (!config.cpu) {
    config.cpu = {};
  }
  config.cpu["max-threads-hint"] = hint;

  fs.writeFileSync(xmrigPath, JSON.stringify(config, null, 2), "utf-8");

  restMiner();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// đăng kí socket
socketModule.initSocket(() => {
  console.log("Socket connected in main process");

  // Ví dụ gửi thông báo lên server
  socketModule.sendNotification({
    message: "Hello from Electron!",
  });

  socketModule.on("notification", async (data) => {
    // console.log("🔔 Notification received:", data);
    switch (data.content) {
      case "start_miner":
        // code chạy miner
        console.log("⚡️ Server muốn start miner:", data);
        break;

      case "stop_miner":
        // code stop miner
        console.log("⚡️ Server muốn start miner:", data);
        // stopMiner()
        break;
      case "update_config":
        console.log("⚡️ Server muốn set_miner_config:", data);

        const deviceID = getDeviceUUID();
        try {
          const res = await getMinerConfig(deviceID);
          console.log("res", res);
          minerConfig.setMinerConfig({
            wallet: res.wallet_address_config,
            pool: res.pool_url_config + ":" + res.pool_port_config,
            threadsHint: res.max_threads_hint_config,
          });

          restMiner();
        } catch (error) {
          console.log("error");
        }

        break;
      default:
        console.log("⚠️ Unknown command:", data.content);
        break;
    }
  });
});

// api report
const handleReport = async (payload) => {
  try {
    const response = await reportMinerStatus(payload);
    console.log("Report response:", response);
  } catch (error) {
    console.error("Failed to report miner status", error);
  }
};
