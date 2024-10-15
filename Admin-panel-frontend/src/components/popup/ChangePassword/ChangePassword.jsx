import React, { useState, useEffect } from "react";
import { changePassword } from "../../../Api/api";

const ChangePassword = ({ onClose, Done }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState("");

  const validatePassword = () => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError(
        "Password must be at least 8 characters long and include lower and upper characters, at least 1 number or symbol."
      );
      return false;
    }
    if (newPassword !== repeatPassword) {
      setError("Passwords do not match.");
      return false;
    }
    if (currentPassword === newPassword) {
      setError("New password and current password can't be same");
      return false;
    }
    setError("");
    return true;
  };

  const handleSave = async () => {
    if (validatePassword()) {
      // Add your save logic here
      try {
        const token = sessionStorage.getItem("token");
        const response = await changePassword(
          token,
          currentPassword,
          newPassword
        );

        const data = await response.json();
        await Done();
      } catch (error) {
        setError("Error logging in:" + error.message);
      }
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "8px",
    marginTop: "5px",
    marginBottom: "15px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: "20",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          width: "400px",
          padding: "15px 30px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2
            style={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              marginBottom: "20px",
              fontSize: "33px",
            }}
          >
            Change Password
          </h2>
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "0px",
              right: "5px",
              background: "none",
              border: "none",
              fontSize: "25px",
              cursor: "pointer",
            }}
          >
            &times;
          </button>
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label>
            Current Password:
            <input
              type="password"
              style={inputStyle}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>
          <label>
            New Password:
            <input
              type="password"
              style={inputStyle}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </label>
          <label>
            Repeat Password:
            <input
              type="password"
              style={inputStyle}
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
            />
          </label>
          {error && (
            <div style={{ color: "red", marginBottom: "15px" }}>{error}</div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button
              style={{
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                padding: "10px 20px",
                cursor: "pointer",
                borderRadius: "4px",
              }}
              onClick={handleSave}
            >
              Save
            </button>
            <button
              style={{
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                padding: "10px 20px",
                cursor: "pointer",
                borderRadius: "4px",
              }}
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
          <div style={{ marginTop: "20px", fontSize: "14px", color: "#555" }}>
            <p>
              <strong> Password must:</strong>
            </p>
            <ul>
              <li>include lower and upper characters</li>
              <li>include at least 1 number or symbol</li>
              <li>be at least 8 characters long</li>
              <li>match in both fields</li>
              <li>cannot contain spaces and "|" symbol</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
