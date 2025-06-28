import axios from "axios";
import config from "../config"; // Import URL từ file config
const API_URL = config.apiBaseUrl;
const logidn = (mobileNumber, password) => {
  return axios.post(API_URL + "login", {
    mobile_number: mobileNumber,
    password,
  });
};

const Api = {
  logidn,
};
export default Api;
