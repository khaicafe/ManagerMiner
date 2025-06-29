const axios = require("axios");
const config = require("../config");

const API_URL = config.apiBaseUrl;

const reportMinerStatus = async (minerData) => {
  try {
    const res = await axios.post(API_URL + "/report", minerData);
    return res.data;
  } catch (error) {
    console.error("Error reporting miner status:", error);
    throw error;
  }
};

async function getMinerConfig(deviceID) {
  try {
    const res = await axios.get(`${API_URL}/miners/config/${deviceID}`);
    return res.data;
  } catch (err) {
    console.error("❌ Error fetching miner config:", err.message);
    throw err;
  }
}

async function updateMaxHint(data) {
  try {
    const res = await axios.post(API_URL + "/miners/update-maxhint", data);
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
