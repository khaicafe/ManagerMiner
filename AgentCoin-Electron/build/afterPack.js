const path = require("path");
const { execSync } = require("child_process");

module.exports = async function (context) {
  const appOutDir = context.appOutDir;
  const xmrigPath = path.join(appOutDir, "xmrig", "xmrigWin.exe");

  console.log("Signing xmrigWin.exe:", xmrigPath);

  execSync(
    `wine signtool.exe sign /f ca.pfx /p 1 /tr http://timestamp.digicert.com /td sha256 /fd sha256 "${xmrigPath}"`,
    { stdio: "inherit" }
  );
};
