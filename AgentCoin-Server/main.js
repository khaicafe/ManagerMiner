const { app, BrowserWindow, ipcMain, Tray, Menu } = require("electron");
const path = require("path");
const { spawn, exec } = require("child_process");
const os = require("os");

let win;
let tray;
let devProcess;

function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("index.html");

  win.on("close", (e) => {
    if (!app.isQuiting) {
      e.preventDefault();
      win.hide();
    }
  });
}

app.whenReady().then(() => {
  const gotLock = app.requestSingleInstanceLock();

  if (!gotLock) {
    app.quit();
    return;
  } else {
    app.on("second-instance", () => {
      if (win) {
        if (win.isMinimized()) win.restore();
        win.show();
      }
    });
  }

  createWindow();

  tray = new Tray(path.join(__dirname, "icon.png"));
  const contextMenu = Menu.buildFromTemplate([
    { label: "Show", click: () => win.show() },
    {
      label: "Quit",
      click: () => {
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);
  tray.setToolTip("Agent Coin Miner");
  tray.setContextMenu(contextMenu);
});

// Tự động chọn file app đúng platform
function getAppExePath() {
  let exeName;
  if (os.platform() === "win32") {
    exeName = "app.exe";
  } else if (os.platform() === "darwin") {
    exeName = "app";
  } else {
    exeName = "app";
  }
  return path.join(__dirname, "server", exeName);
}

// Chạy lệnh service (install, uninstall, start, stop, restart, dev)
ipcMain.handle("service-action", async (event, action) => {
  const exePath = getAppExePath();
  console.log(`[Electron] Running: ${exePath} ${action}`);

  return new Promise((resolve, reject) => {
    const proc = spawn(exePath, [action]);

    let output = "";

    proc.stdout.on("data", (data) => {
      const text = data.toString();
      console.log("[service stdout]", text);
      win.webContents.send("log", text);
      output += text;
    });

    proc.stderr.on("data", (data) => {
      const text = data.toString();
      console.error("[service stderr]", text);
      win.webContents.send("log", text);
      output += text;
    });

    proc.on("error", (err) => {
      console.error("Service process error:", err);
      win.webContents.send(
        "log",
        "Error running service process: " + err.message
      );
      resolve(`Process error: ${err.message}`);
    });

    proc.on("close", (code) => {
      console.log(`Service exited with code ${code}`);
      resolve(`Process exited with code ${code}\n${output}`);
    });
  });
});

// Lấy trạng thái Service
ipcMain.handle("service-status", async () => {
  if (os.platform() !== "win32") {
    return { installed: false, running: false, platform: os.platform() };
  }

  return new Promise((resolve) => {
    exec(`sc query AgentServer`, (error, stdout) => {
      if (error) {
        console.log("Service check error:", error.message);
        resolve({ installed: false, running: false });
        return;
      }
      if (stdout.includes("RUNNING")) {
        resolve({ installed: true, running: true });
      } else if (stdout.includes("STOPPED")) {
        resolve({ installed: true, running: false });
      } else {
        resolve({ installed: false, running: false });
      }
    });
  });
});

// Chạy Dev hoặc Stop Dev
ipcMain.handle("run-dev", async () => {
  const exePath = getAppExePath();

  if (devProcess) {
    console.log("Stopping dev process...");
    devProcess.kill();
    devProcess = null;
    return "Stopped dev process";
  } else {
    console.log("Starting dev process...");
    devProcess = spawn(exePath, ["dev"]);

    devProcess.stdout.on("data", (data) => {
      const text = data.toString();
      console.log("[dev stdout]", text);
      win.webContents.send("log", text);
    });

    devProcess.stderr.on("data", (data) => {
      const text = data.toString();
      console.error("[dev stderr]", text);
      win.webContents.send("log", text);
    });

    devProcess.on("close", (code) => {
      console.log(`Dev process exited with code ${code}`);
      win.webContents.send("log", `Dev process exited with code ${code}`);
      devProcess = null;
    });

    return "Started dev process";
  }
});
