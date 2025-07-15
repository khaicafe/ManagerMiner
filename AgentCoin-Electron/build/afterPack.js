const path = require("path");
const { execSync } = require("child_process");

const signtoolPath = path.join(
  __dirname,
  "build",
  "winCodeSign-2.6.0",
  "windows-10",
  "ia32",
  "signtool.exe"
);

const xmrigPath =
  "/Users/khaicafe/Develop/MinerCoinManager/AgentCoin-Electron/dist/win-unpacked/xmrig/xmrigWin.exe";

execSync(
  `wine "${signtoolPath}" sign /f ca.pfx /p 1 /tr http://timestamp.digicert.com /td sha256 /fd sha256 "${xmrigPath}"`,
  { stdio: "inherit" }
);
