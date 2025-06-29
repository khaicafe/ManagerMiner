import axios from "axios";
import config from "../config"; // Import URL từ file config
const API_URL = config.apiBaseUrl + "/miners";
const BASE_URL = config.apiBaseUrl;

export const getAllMiners = () => {
  return axios.get(API_URL);
};

export const fetchAllCoins = () => {
  return axios.get(`${BASE_URL}/coins-all`);
};
export const updateMiner = (payload) => {
  // payload là array list miners update
  return axios.post(`${BASE_URL}/miners/update-list`, payload);
};

export const startMining = (data) =>
  axios.post(BASE_URL + "/miners/start", data);

export const stopMining = (data) => axios.post(BASE_URL + "/miners/stop", data);

// COIN
export const createCoinFull = (data) =>
  axios.post(BASE_URL + "/coins/full", data);

export const updateCoinFull = (id, data) =>
  axios.put(BASE_URL + `/coins/${id}/full`, data);

export const deleteCoinFull = (coinId) =>
  axios.delete(BASE_URL + `/coins/${coinId}/full`);

/////////
export const getCoins = () => axios.get(`${BASE_URL}/coins`);
export const getCoin = (id) => axios.get(`${BASE_URL}/coins/${id}`);
export const createCoin = (data) => axios.post(`${BASE_URL}/coins`, data);
export const updateCoin = (id, data) =>
  axios.put(`${BASE_URL}/coins/${id}`, data);
export const deleteCoin = (id) => axios.delete(`${BASE_URL}/coins/${id}`);

export const getPools = () => axios.get(`${BASE_URL}/pools`);
export const createPool = (data) => axios.post(`${BASE_URL}/pools`, data);
export const updatePool = (id, data) =>
  axios.put(`${BASE_URL}/pools/${id}`, data);
export const deletePool = (id) => axios.delete(`${BASE_URL}/pools/${id}`);

export const getWallets = () => axios.get(`${BASE_URL}/wallets`);
export const createWallet = (data) => axios.post(`${BASE_URL}/wallets`, data);
export const updateWallet = (id, data) =>
  axios.put(`${BASE_URL}/wallets/${id}`, data);
export const deleteWallet = (id) => axios.delete(`${BASE_URL}/wallets/${id}`);
