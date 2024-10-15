import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

<<<<<<< HEAD
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace />;
  // }
=======
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
>>>>>>> 068ae200d36dc9e91c7d40e7b4847434738a876e

  return children;
};

export default ProtectedRoute;
