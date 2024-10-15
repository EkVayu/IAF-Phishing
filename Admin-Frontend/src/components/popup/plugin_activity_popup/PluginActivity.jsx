import React, { useState } from "react";
import { MdCancel } from "react-icons/md";
import { IoCaretBackCircle } from "react-icons/io5";

const Popup = ({ plugins, backPopup }) => {
  const [popup, setPopup] = useState(true);

  const removePopup = () => {
    console.log("Popup clicked");
    setPopup(false);
  };

  if (!popup) return null;

  return (
    <div className="bg-background border border-primary rounded-[8px] overflow-hidden w-[300px] h-auto fixed bottom-0 right-0 shadow-md mr-5 mb-[15px] pb-[10px] z-100">
      <div className="bg-primary h-[30px] w-full font-bold text-white text-center">
        Plugin Details
        {popup && (
          <IoCaretBackCircle
            className="absolute left-2 top-2 cursor-pointer"
            onClick={backPopup}
          />
        )}
        {popup && (
          <MdCancel
            className="absolute right-2 top-2 cursor-pointer"
            onClick={removePopup}
          />
        )}
      </div>
      <div className="flex flex-col items-start px-5 py-2 text-secondary-foreground">
        <p>
          Details for Plugin: <strong>{plugins.id || "N/A"}</strong>
        </p>
        <p>
          User: <strong>{plugins.userName || "N/A"}</strong>
        </p>
        <p>
          Current Status: <strong>online/ofline</strong>
        </p>
      </div>
      <div className="flex items-center justify-center mt-5">
        <button className="bg-primary hover:bg-secondary text-white border-none rounded-sm px-4 py-1 cursor-pointer">
          View
        </button>
      </div>
    </div>
  );
};

export default Popup;
