const fs = require("fs");
const path = require("path");
const { app } = require("electron");
// const xmrigConfigPath = path.join(
//   __dirname,
//   "..",
//   "..",
//   "xmrig",
//   "config.json"
// );

function getXmrigConfigPath() {
  const basePath =
    app && app.isPackaged
      ? process.resourcesPath
      : path.join(__dirname, "..", "..");

  return path.join(basePath, "xmrig", "config.json");
}
const xmrigConfigPath = getXmrigConfigPath();

function getConfig() {
  try {
    const rawData = fs.readFileSync(xmrigConfigPath, "utf8");
    return JSON.parse(rawData);
  } catch (e) {
    console.error("❌ Error reading config.json:", e);
    return null;
  }
}

function saveConfig(config) {
  try {
    fs.writeFileSync(xmrigConfigPath, JSON.stringify(config, null, 2), "utf8");
    console.log("✅ Config saved!");
  } catch (e) {
    console.error("❌ Error saving config.json:", e);
  }
}

function getWallet() {
  const config = getConfig();
  if (config && config.pools && config.pools.length > 0) {
    return config.pools[0].user;
  }
  return null;
}

function getPool() {
  const config = getConfig();
  if (config && config.pools && config.pools.length > 0) {
    return config.pools[0].url;
  }
  return null;
}

function getMaxThreadsHint() {
  const config = getConfig();
  if (config && config.cpu && config.cpu["max-threads-hint"] !== undefined) {
    return config.cpu["max-threads-hint"];
  }
  return null;
}

async function setMinerConfig({ wallet, pool, threadsHint }) {
  console.log("setMinerconfig", pool, wallet, threadsHint);
  const config = await getConfig();
  if (config && config.pools && config.pools.length > 0) {
    config.pools[0].user = wallet;
    config.pools[0].url = pool;
    config.cpu["max-threads-hint"] = threadsHint;
    // if (wallet) {
    //   config.pools[0].user = wallet;
    // }
    // if (pool) {
    //   config.pools[0].url = pool;
    // }
    // if (threadsHint != null && config.cpu) {
    //   config.cpu["max-threads-hint"] = threadsHint;
    // }
    console.log("change config", config.pools);
    saveConfig(config);
  }
}

module.exports = {
  getWallet,
  getPool,
  setMinerConfig,
  getMaxThreadsHint,
};
