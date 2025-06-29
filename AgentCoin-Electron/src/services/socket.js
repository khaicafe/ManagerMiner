const io = require("socket.io-client");
const config = require("../config/index.js"); // adjust path as needed
const os = require("os");
const { execSync } = require("child_process");

// const SERVER_URL = config.WEBSOCKET_URL;
// const PATH = config.WEBSOCKET_PATH;

const SERVER_URL = "http://localhost:8080";
const PATH = "/api/socket-io";
console.log("path socket", config);

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

function initSocket(onConnectedCallback) {
  console.log("socket:", SERVER_URL, "path:", PATH);

  socket = io(SERVER_URL, {
    transports: ["websocket"],
    path: PATH,
  });

  socket.on("connect", () => {
    console.log("✅ Connected to server");
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
