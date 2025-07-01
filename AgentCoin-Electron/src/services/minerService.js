const axios = require("axios");
const config = require("../config");
const minerConfig = require("../../miner.json");

const API_URL = config.apiBaseUrl;

const getUrl = ()=>{
  const fullUrl = minerConfig.server_url;
  const urlObj = new URL(fullUrl);

  // Lấy origin + pathname
  let basePath = urlObj.origin + urlObj.pathname;

  // Xóa /report nếu có
  if (basePath.endsWith("/report")) {
    basePath = basePath.replace(/\/report$/, "");
  }
  return basePath
}

const reportMinerStatus = async (minerData) => {
  try {
    const res = await axios.post(getUrl() + "/report", minerData);
    return res.data;
  } catch (error) {
    console.error("Error reporting miner status:", error);
    throw error;
  }
};

async function getMinerConfig(deviceID) {
  try {
    const res = await axios.get(`${getUrl() }/miners/config/${deviceID}`);
    return res.data;
  } catch (err) {
    console.error("❌ Error fetching miner config:", err.message);
    throw err;
  }
}

async function updateMaxHint(data) {
  try {
    const res = await axios.post(getUrl()  + "/miners/update-maxhint", data);
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
