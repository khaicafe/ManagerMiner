const fs = require("fs");
const path = require("path");

const xmrigConfigPath = path.join(
  __dirname,
  "..",
  "..",
  "xmrig",
  "config.json"
);

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

function setMinerConfig({ wallet, pool, threadsHint }) {
  const config = getConfig();
  if (config && config.pools && config.pools.length > 0) {
    if (wallet) {
      config.pools[0].user = wallet;
    }
    if (pool) {
      config.pools[0].url = pool;
    }
    if (threadsHint != null && config.cpu) {
      config.cpu["max-threads-hint"] = threadsHint;
    }

    saveConfig(config);
  }
}

module.exports = {
  getWallet,
  getPool,
  setMinerConfig,
  getMaxThreadsHint,
};
