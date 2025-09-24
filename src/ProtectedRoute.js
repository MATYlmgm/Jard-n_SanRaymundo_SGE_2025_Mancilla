import React from "react";
import { Navigate } from "react-router-dom";
import { auth } from "./auth";

export default function ProtectedRoute({ children }) {
  return auth.isLogged() ? children : <Navigate to="/login" replace />;
}