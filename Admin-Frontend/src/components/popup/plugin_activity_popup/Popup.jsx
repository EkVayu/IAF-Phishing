import React, { useState } from "react";
import { MdCancel } from "react-icons/md";

const Popup = ({ onViewDetails }) => {
  const [popup, setPopup] = useState(true);

  const removePopup = () => {
    console.log("Popup clicked");
    setPopup(false);
  };

  if (!popup) return null;

  return (
    <div className="bg-background border border-red-500 rounded-[8px] overflow-hidden w-[300px] h-auto text-center fixed bottom-0 right-0 shadow-md z-100 mr-5 mb-4 pb-2.5">
      <div className="bg-red-500 h-[30px] w-full p-1.5 mb-4 font-bold text-white">
        Plugin Disabled
        {popup && (
          <MdCancel
            className="float-right mr-2.5 cursor-pointer"
            onClick={removePopup}
          />
        )}
      </div>
      <p className="text-secondary-foreground">
        In Last <strong>15 Minutes</strong>
        <br /> total <strong>10 Plugins</strong> are Disabled.
      </p>
      <div className="flex items-center justify-center mt-5">
        <button
          className="bg-primary hover:bg-secondary text-white border-none rounded-sm px-4 py-1 cursor-pointer"
          onClick={onViewDetails}
        >
          View
        </button>
      </div>
    </div>
  );
};

export default Popup;