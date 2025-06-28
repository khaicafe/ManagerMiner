import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import permissions from "./permissions";

const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" />;

  const user = jwtDecode(token);
  const userRole = user?.role || "cashier";

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
