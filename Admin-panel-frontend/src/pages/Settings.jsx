import React from "react";
import { FiSave, FiGlobe, FiMoon } from "react-icons/fi";

function Settings() {
  return (
    <div className="w-full h-[80vh] bg-background">
      <div className="h-full w-full">
        <div className="p-8 w-full h-full">
          <h1 className="text-4xl font-bold text-primary mb-6">Settings</h1>
          <div className="space-y-8 flex flex-col justify-between w-full h-[65vh]">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <FiGlobe className="text-2xl text-primary" />
                  <label className="text-sm font-medium text-primary">
                    Language
                  </label>
                </div>
                <select className="p-2 border text-black border-primary rounded-md focus:ring-2 focus:ring-secondary focus:border-secondary transition">
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <FiMoon className="text-2xl text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Dark Mode
                  </span>
                </div>
                <label className="switch">
                  <input type="checkbox" />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
            <div className="w-full flex justify-end">
              <button className="w-40 flex items-center justify-center space-x-2 py-3 px-4 rounded-md shadow-sm text-sm font-medium text-background bg-primary hover:bg-secondary transition">
                <FiSave className="text-xl" />
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
