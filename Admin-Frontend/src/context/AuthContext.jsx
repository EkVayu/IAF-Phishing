import React, { createContext, useState, useContext, useEffect } from "react";
import { refreshToken } from "../Api/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedState = sessionStorage.getItem("isAuthenticated");
    return savedState ? JSON.parse(savedState) : false;
  });

  const [token, setToken] = useState(() => {
    return sessionStorage.getItem("token") || "";
  });

  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [role, setRole] = useState(() => {
    const savedRole = sessionStorage.getItem("role");
    return savedRole ? JSON.parse(savedRole) : "";
  });

  useEffect(() => {
    sessionStorage.setItem("isAuthenticated", isAuthenticated);
  }, [isAuthenticated]);

  const login = (newToken, newUser, newRole) => {
    setIsAuthenticated(true);
    setToken(newToken);
    setUser(newUser);
    setRole(newRole);
    sessionStorage.setItem("token", newToken);
    sessionStorage.setItem("user", JSON.stringify(newUser));
    sessionStorage.setItem("role", JSON.stringify(newRole));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setToken("");
    setUser(null);
    setRole("");
    sessionStorage.removeItem("isAuthenticated");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("role");
    window.location.href = "/login";
  };

  const refreshAuthToken = async () => {
    try {
      const response = await refreshToken();
      const data = await response.json();

      if (response.ok && data.token) {
        setToken(data.token);
        sessionStorage.setItem("token", data.token);
      } else {
        throw new Error("Failed to refresh token");
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      logout();
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isAuthenticated) {
        refreshAuthToken();
      }
    }, 60 * 60 * 1000); // Refresh every 60 minutes

    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, token, user, role, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
