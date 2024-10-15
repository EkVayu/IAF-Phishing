import React, { useState, useEffect } from "react";
import styles from "./LicenseForm.module.css";
import { validateEmail } from "../../../Validation";

const LicenseForm = ({ onClose, rowData, handleSubmit, handleRevoke }) => {
  const [email, setEmail] = useState("");
  const [licenseId, setLicenseId] = useState("");
  const [pluginId, setPluginId] = useState("");
  const [error, setError] = useState("");
  const [buttonText, setButtonText] = useState("");

  useEffect(() => {
    if (rowData) {
      setPluginId(rowData?.plugin_id || "");
      // setPluginId(rowData.plugins?.[0]?.plugin_id || "");
      setLicenseId(rowData?.license_id || "");
      setButtonText(rowData?.buttonText || "");
      if (!rowData?.email) {
        setError("");
      } else if (!validateEmail(rowData?.email)) {
        setError("Enter valid email");
      } else {
        setEmail(rowData?.email || "");
        setError("");
      }
    }
  }, [rowData]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError("Enter a valid email");
      return;
    }
    handleSubmit(email, licenseId);
  };

  const onRevoke = (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError("Enter a valid email");
      return;
    }
    handleRevoke(email, licenseId);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
        <h2 className={styles.title}>{buttonText} License</h2>
        <div className={styles.inputContainer}>
          <input
            type="email"
            placeholder="Email"
            value={buttonText === "Revoke" ? rowData.email : email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              backgroundColor: buttonText === "Revoke" ? "#e0e0e0" : "white",
            }}
            className={styles.input}
            readOnly={buttonText === "Revoke"}
          />
          {error && (
            <div
              style={{
                color: "red",
                marginBottom: "10px",
                marginLeft: "10px",
                top: "0",
              }}
            >
              {error}
            </div>
          )}
          <input
            type="text"
            placeholder="License ID"
            value={licenseId}
            style={{ backgroundColor: "#e0e0e0" }}
            className={styles.input}
            readOnly
          />
        </div>
        <div className={styles.buttonContainer}>
          {buttonText === "Allocate" && (
            <button
              type="submit"
              className={styles.sendButton}
              onClick={onSubmit}
            >
              Allocate
            </button>
          )}
          {buttonText === "Revoke" && (
            <button
              type="submit"
              className={styles.sendButton}
              onClick={onRevoke}
            >
              Revoke
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LicenseForm;
