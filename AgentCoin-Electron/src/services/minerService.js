// const axios = require("axios");
// const config = require("../config");
// const minerConfig = require("../../miner.json");

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

async function getMinerConfigPath() {
  if (app && app.isPackaged) {
    return path.join(process.resourcesPath, "miner.json");
  } else {
    return path.join(__dirname, "..", "..", "miner.json");
  }
}

async function readMinerConfig() {
  const configPath = await getMinerConfigPath();
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("❌ Cannot read miner.json:", e.message);
    return {};
  }
}

const getUrl = async () => {
  const minerConfig = await readMinerConfig();

  const fullUrl = minerConfig.server_url;
  const urlObj = new URL(fullUrl);

  // Lấy origin + pathname
  let basePath = urlObj.origin + urlObj.pathname;

  // Xóa /report nếu có
  if (basePath.endsWith("/report")) {
    basePath = basePath.replace(/\/report$/, "");
  }
  console.log("url", basePath);
  return basePath;
};

const reportMinerStatus = async (minerData) => {
  try {
    const res = await axios.post((await getUrl()) + "/report", minerData);
    return res.data;
  } catch (error) {
    console.error("Error reporting miner status:", error);
    throw error;
  }
};

async function getMinerConfig(deviceID) {
  try {
    const res = await axios.get(`${await getUrl()}/miners/config/${deviceID}`);
    return res.data;
  } catch (err) {
    console.error("❌ Error fetching miner config:", err.message);
    throw err;
  }
}

async function updateMaxHint(data) {
  try {
    const res = await axios.post(
      (await getUrl()) + "/miners/update-maxhint",
      data
    );
    return res.data;
  } catch (error) {
    console.error("❌ Error fetching miner config:", err.message);
    throw err;
  }
}

module.exports = {
  reportMinerStatus,
  getMinerConfig,
  updateMaxHint,
};
