import React, { useState } from "react";
import { changePassword } from "../../../Api/api";
import { toast } from "react-toastify";

const ChangePassword = ({ onClose, Done }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
      setIsLoading(true);
      try {
        const response = await changePassword(currentPassword, newPassword);
        const data = await response.json();

        if (response.ok) {
          toast.success("Password changed successfully!");
          await Done();
          onClose();
        } else {
          toast.error(data.message || "Failed to change password");
          setError(data.message || "Failed to change password");
        }
      } catch (error) {
        toast.error("Error changing password");
        setError("Error changing password: " + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20">
      <div className="bg-background rounded-lg w-[400px] p-[15px_30px] shadow-md relative text-secondary-foreground">
        <div className="flex justify-between items-center">
          <h2 className="flex justify-center w-full mb-5 text-3xl">
            Change Password
          </h2>
          <button
            onClick={onClose}
            className="absolute top-0 right-1 bg-transparent border-none text-2xl cursor-pointer"
          >
            &times;
          </button>
        </div>
        <div className="mb-5">
          <label className="block mb-4">
            Current Password:
            <input
              type="password"
              className="w-full p-2 mt-1 mb-2 border border-gray-300 rounded dark:bg-gray-800"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isLoading}
            />
          </label>
          <label className="block mb-4">
            New Password:
            <input
              type="password"
              className="w-full p-2 mt-1 mb-2 border border-gray-300 rounded dark:bg-gray-800"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
            />
          </label>
          <label className="block mb-4">
            Repeat Password:
            <input
              type="password"
              className="w-full p-2 mt-1 mb-2 border border-gray-300 rounded dark:bg-gray-800"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              disabled={isLoading}
            />
          </label>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <div className="flex justify-between">
            <button
              className={`bg-green-500 text-white border-none py-2 px-5 cursor-pointer rounded flex items-center ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </button>
            <button
              className="bg-red-500 text-white border-none py-2 px-5 cursor-pointer rounded"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
          <div className="mt-5 text-sm text-gray-600">
            <p>
              <strong> Password must:</strong>
            </p>
            <ul className="list-disc pl-5">
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
