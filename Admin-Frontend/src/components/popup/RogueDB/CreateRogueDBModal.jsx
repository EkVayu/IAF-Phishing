import { Close } from "@mui/icons-material";
import React from "react";

function CreateRogueDBModal({ isOpen, onClose, activeTab, onSubmit, loading }) {
  if (!isOpen) return null;

  const renderForm = () => {
    switch (activeTab) {
      case "url":
        return (
          <form onSubmit={onSubmit} className="flex flex-col space-y-4">
            <input
              type="text"
              name="url"
              placeholder="Enter URL"
              required
              className="border border-primary rounded-md px-2 py-1 dark:bg-gray-700"
            />
            <input
              type="text"
              name="protocol"
              placeholder="Enter Protocol"
              required
              className="border border-primary rounded-md px-2 py-1 dark:bg-gray-700"
            />
            <button
              type="submit"
              className="bg-primary text-white px-4 py-2 rounded"
            >
              {loading ? "Creating..." : "Add URL"}
            </button>
          </form>
        );
      case "domain":
        return (
          <form onSubmit={onSubmit} className="flex flex-col space-y-4">
            <input
              type="text"
              name="ip"
              placeholder="Enter IP"
              required
              className="border border-primary rounded-md px-2 py-1 dark:bg-gray-700"
            />
            <input
              type="text"
              name="prototype"
              placeholder="Enter Prototype"
              required
              className="border border-primary rounded-md px-2 py-1 dark:bg-gray-700"
            />
            <button
              type="submit"
              className="bg-primary text-white px-4 py-2 rounded"
            >
              {loading ? "Creating..." : "Add Domain"}
            </button>
          </form>
        );
      case "mail":
        return (
          <form onSubmit={onSubmit} className="flex flex-col space-y-4">
            <input
              type="email"
              name="mailid"
              placeholder="Enter Email"
              required
              className="border border-primary rounded-md px-2 py-1 dark:bg-gray-700"
            />
            <button
              type="submit"
              className="bg-primary text-white px-4 py-2 rounded"
            >
              {loading ? "Creating..." : "Add Mail"}
            </button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg relative">
        <h2 className="text-xl font-bold mb-4 text-secondary-foreground">
          Add {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </h2>
        {renderForm()}
        <button
          onClick={onClose}
          className="text-red-500 rounded-full absolute top-2 right-2"
        >
          <Close className="w-1 h-1" />
        </button>
      </div>
    </div>
  );
}

export default CreateRogueDBModal;
