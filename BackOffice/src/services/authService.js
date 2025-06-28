import axios from "axios";
import config from "../config";

const API_URL = config.apiBaseUrl + "/auth/";

const login = (mobileNumber, password) => {
  return axios.post(API_URL + "login", {
    mobile_number: mobileNumber,
    password,
  });
};

const signup = (mobileNumber, password) => {
  return axios.post(API_URL + "signup", {
    mobile_number: mobileNumber,
    password,
  });
};

const verifySignupOtp = (mobileNumber, otp) => {
  return axios.post(API_URL + "verify-signup-otp", {
    mobile_number: mobileNumber,
    otp,
  });
};

const resendOtp = (mobileNumber) => {
  return axios.post(API_URL + "resend-otp", { mobile_number: mobileNumber });
};

const sendOtp = (mobileNumber) => {
  return axios.post(API_URL + "send-otp", { mobile_number: mobileNumber });
};

const resetPassword = (mobileNumber, otp, newPassword) => {
  return axios.post(API_URL + "reset-password", {
    mobile_number: mobileNumber,
    otp,
    new_password: newPassword,
  });
};

const Api = {
  login,
  signup,
  verifySignupOtp,
  resendOtp,
  sendOtp,
  resetPassword,
};
export default Api;
