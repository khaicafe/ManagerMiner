// const minerConfig = require("../../miner.json");
// const getUrl = ()=>{
//   const fullUrl = minerConfig.server_url;
//   const urlObj = new URL(fullUrl);

//   // Lấy origin + pathname
//   let basePath = urlObj.origin + urlObj.pathname;

//   // Xóa /report nếu có
//   if (basePath.endsWith("/report")) {
//     basePath = basePath.replace(/\/report$/, "");
//   }
//   return basePath
// }
// const API_URL = getUrl();
const config = {
  apiBaseUrl: "http://192.167.1.7:8080/api",
  BaseUrl: "http://192.167.1.7:8080/api",
  WEBSOCKET_URL: "http://192.167.1.7:8080",
  WEBSOCKET_PATH: "/api/socket-io",
};

module.exports = config;
