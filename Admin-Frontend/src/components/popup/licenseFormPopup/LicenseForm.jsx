import React, { useState, useEffect } from "react";
import { validateEmail } from "../../../Validation";

const LicenseForm = ({ onClose, rowData, handleSubmit, handleRevoke, loading }) => {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-6 w-full max-w-80 relative">
        <button
          className="absolute top-2 right-2 text-3xl text-red-500"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-secondary-foreground text-xl text-center mb-4">
          {buttonText} License
        </h2>
        <div className="flex flex-col items-center">
          <input
            type="email"
            placeholder="Email"
            value={buttonText === "Revoke" ? rowData.email : email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full mt-2 p-2 rounded border bg-gray-200 dark:bg-gray-700 text-secondary-foreground`}
            readOnly={buttonText === "Revoke"}
          />
          {error && (
            <div className="text-red-500 mt-1 ml-2 self-start">{error}</div>
          )}
          <input
            type="text"
            placeholder="License ID"
            value={licenseId}
            className={`w-full mt-2 p-2 rounded border bg-gray-200 cursor-not-allowed outline-none dark:bg-gray-700 text-secondary-foreground`}
            readOnly
          />
        </div>
        <div className="mt-4 flex justify-center">
          {buttonText === "Allocate" && (
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={onSubmit}
            >
              {loading ? "Allocating..." : "Allocate"}
            </button>
          )}
          {buttonText === "Revoke" && (
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={onRevoke}
            >
              {loading ? "Revoking..." : "Revoke"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LicenseForm;
