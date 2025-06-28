import React from "react";
import {
  Navigate,
  Routes,
  Route,
  HashRouter as Router,
} from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import PrivateRoute from "./screens/Auth/PrivateRoute";
import Layout from "./screens/Auth/Layout";
import Dashboard from "./screens/Dashboard";
import Login from "./screens/Login";

import theme from "./theme/theme";
// import SettingScreen from "./screens/SettingScreen";

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route element={<PrivateRoute roles={["admin"]} />}>
              {/* <Route path="/deviceScreen" element={<DeviceScreen />} /> */}
              {/* <Route path="/settings" element={<SettingScreen />} /> */}
            </Route>

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Router>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </ThemeProvider>
  );
};
export default App;
