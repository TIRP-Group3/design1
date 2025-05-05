// frontend/src/pages/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute() {
  // Check if user is logged in
  const token = localStorage.getItem("token");

  // If no token, redirect to login page
  if (!token) {
    return <Navigate to="/login" />;
  }

  return <Outlet />;  // Render the child route (protected route)
}

export default ProtectedRoute;
