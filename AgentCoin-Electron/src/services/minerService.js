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

module.exports = {
  reportMinerStatus,
};
