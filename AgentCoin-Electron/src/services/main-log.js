const fs = require("fs");
const path = require("path");
const { Tray, Menu, app, BrowserWindow, ipcMain } = require("electron");

// const logPath = path.join(process.cwd(), "agentcoin-main.log");

const isDev = !app.isPackaged;
const logPath = isDev
  ? path.join(process.cwd(), "agentcoin-main.log")
  : path.join(app.getPath("userData"), "agentcoin-main.log");

function logToFile(message) {
  console.log(message);

  const timestamp = new Date().toISOString();

  let msgStr = "";

  if (Array.isArray(message)) {
    msgStr = message
      .map((item) => {
        if (item instanceof Error) {
          return item.stack || item.message;
        }
        if (typeof item === "object") {
          try {
            return JSON.stringify(item, null, 2);
          } catch {
            return "[Object could not be stringified]";
          }
        }
        return String(item);
      })
      .join(" ");
  } else if (message instanceof Error) {
    msgStr = message.stack || message.message;
  } else if (typeof message === "object") {
    try {
      msgStr = JSON.stringify(message, null, 2);
    } catch {
      msgStr = "[Object could not be stringified]";
    }
  } else {
    msgStr = String(message);
  }

  const finalMsg = `[${timestamp}] ${msgStr}\n`;

  fs.appendFileSync(logPath, finalMsg);
}

module.exports = { logToFile };
