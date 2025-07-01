const { app, BrowserWindow, ipcMain, Tray, Menu } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

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

// Xử lý các IPC lệnh service
ipcMain.handle("service-action", async (event, action) => {
  console.log(`[Electron] Running: app.exe ${action}`);
  // const exePath = path.join(__dirname, "server", "app.exe");
  const exePath = path.join(__dirname, "server", "app");

  return new Promise((resolve, reject) => {
    const proc = spawn(exePath, [action]);

    let output = "";

    proc.stdout.on("data", (data) => {
      win.webContents.send("log", data.toString());
      output += data.toString();
    });

    proc.stderr.on("data", (data) => {
      win.webContents.send("log", data.toString());
      output += data.toString();
    });

    proc.on("close", (code) => {
      resolve(`Process exited with code ${code}\n${output}`);
    });
  });
});

// Chạy Dev hoặc Stop Dev
ipcMain.handle("run-dev", async () => {
  const exePath = path.join(__dirname, "server", "app.exe");

  if (devProcess) {
    devProcess.kill();
    devProcess = null;
    return "Stopped dev process";
  } else {
    devProcess = spawn(exePath, ["dev"]);

    devProcess.stdout.on("data", (data) => {
      win.webContents.send("log", data.toString());
    });

    devProcess.stderr.on("data", (data) => {
      win.webContents.send("log", data.toString());
    });

    devProcess.on("close", () => {
      win.webContents.send("log", "Dev process exited.");
      devProcess = null;
    });

    return "Started dev process";
  }
});
