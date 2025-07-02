const io = require("socket.io-client");
const config = require("../config/index.js"); // adjust path as needed
const os = require("os");
const { execSync } = require("child_process");
// const minerConfig = require("../../miner.json");
const path = require("path");
const { app } = require("electron");
const fs = require("fs");

const { logToFile } = require("./main-log.js");

async function getMinerConfigPath() {
  if (app && app.isPackaged) {
    const userDataPath = app.getPath("userData");
    let minerConfigPath = path.join(userDataPath, "miner.json");
    // path.join(process.resourcesPath, "miner.json");
    logToFile(`🌐 log1: ${path.join(process.resourcesPath, "miner.json")}`);
    return minerConfigPath;
  } else {
    logToFile(`🌐 log1: ${path.join(__dirname, "..", "..", "miner.json")}`);
    return path.join(__dirname, "..", "..", "miner.json");
  }
}

async function readMinerConfig() {
  const configPath = await getMinerConfigPath();
  logToFile(`🌐 log2: ${configPath}`);
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("❌ Cannot read miner.json:", e.message);
    return {};
  }
}

const SERVER_URL = async () => {
  const minerConfig = await readMinerConfig();

  // const fullUrl = minerConfig.server_url;
  // console.error("⚠️ server_url missing in miner.json!",fullUrl);
  // const urlObj = new URL(fullUrl);
  // return urlObj.origin;
  // if (!minerConfig.server_url) {
  //   console.error("⚠️ server_url missing in miner.json!");
  //   return "";
  // }

  try {
    logToFile(`🌐 log3: ${JSON.stringify(minerConfig, null, 2)}`);
    const fullUrl = minerConfig.server_url;
    logToFile(`🌐 log4: ${JSON.stringify(fullUrl, null, 2)}`);

    const urlObj = new URL(fullUrl);
    return urlObj.origin;
  } catch (e) {
    console.error("❌ Invalid URL in miner.json:", minerConfig.server_url);
    return "";
  }
};

// const SERVER_URL = config.WEBSOCKET_URL;
// const PATH = config.WEBSOCKET_PATH;
const PATH = "/api/socket-io";
// const SERVER_URL = "http://localhost:8080";
// const PATH = "/api/socket-io";
// console.log("path socket", config);

let socket = null;

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

const USER_ID = getDeviceUUID(); // Thay thế bằng user ID thực tế của bạn

async function initSocket(onConnectedCallback) {
  console.log("socket:", await SERVER_URL(), "path:", PATH);

  socket = io(await SERVER_URL(), {
    transports: ["websocket"],
    path: PATH,
  });

  socket.on("connect", () => {
    console.log("✅ Connected to server");
    logToFile(`🌐 log5: "✅ Connected to server"`);
    socket.emit("registerUser", USER_ID);
    if (typeof onConnectedCallback === "function") {
      onConnectedCallback();
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected from server");
  });

  socket.on("connect_error", (error) => {
    console.error("⚠️ Connect error:", error);
  });

  //   socket.on("notification", (data) => {
  //     console.log("🔔 Notification received:", data);
  //   });
}

function sendNotification(data) {
  if (socket && socket.connected) {
    socket.emit("notification_Client", data);
  } else {
    console.warn("⚠️ Socket not connected. Cannot send data.");
  }
}

function on(event, callback) {
  if (socket) {
    socket.on(event, callback);
  }
}

function closeSocket() {
  if (socket) {
    socket.disconnect();
  }
}

module.exports = {
  initSocket,
  sendNotification,
  closeSocket,
  on,
};
