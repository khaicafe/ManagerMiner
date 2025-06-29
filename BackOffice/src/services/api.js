import axios from "axios";
import config from "../config"; // Import URL từ file config
const API_URL = config.apiBaseUrl + "/miners";

export const getAllMiners = () => {
  return axios.get(API_URL);
};
