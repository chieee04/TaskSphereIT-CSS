// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const protectedRoute = ({ children, allowedRoles }) => {
  const storedUser = localStorage.getItem("customUser");

  if (!storedUser) {
    // ❌ Not logged in — balik sa Signin
    return <Navigate to="/Signin" replace />;
  }

  const user = JSON.parse(storedUser);

  // ✅ If may allowedRoles parameter (optional), check role
  if (allowedRoles && !allowedRoles.includes(user.user_roles)) {
    return <Navigate to="/Signin" replace />;
  }

  // ✅ Allowed, render child page
  return children;
};

export default protectedRoute;
