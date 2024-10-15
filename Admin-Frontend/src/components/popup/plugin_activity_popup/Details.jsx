import React, { useState } from "react";
import { MdCancel } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { IoCaretBackCircle } from "react-icons/io5";

const Details = ({ plugins, backPopup, pluginActivity }) => {
  const [showPopup, setShowPopup] = useState(true);
  const navigate = useNavigate();

  const handlePopup = () => {
    setShowPopup(false);
  };

  const handleViewMoreClick = () => {
    handlePopup();
    navigate("/plugin");
  };

  if (!showPopup) return null;
  return (
    <div className="fixed bottom-0 right-0 z-100 w-[300px] bg-background border border-primary rounded-[8px] p-[10px] pt-[5px] text-center shadow-[0_0_10px_rgba(0,0,0,0.1)] mr-[20px] mb-[15px]">
      <h3 className="text-secondary-foreground mb-1">Plugin Details</h3>
      {showPopup && (
        <IoCaretBackCircle
          className="absolute left-0 top-0 mt-[5px] ml-[7px] cursor-pointer text-secondary-foreground"
          onClick={backPopup}
        />
      )}
      {showPopup && (
        <MdCancel
          className="absolute right-0 top-0 mt-[5px] mr-[7px] cursor-pointer text-red-500"
          onClick={handlePopup}
        />
      )}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-primary text-white text-[10px] tracking-wider">
            <th className="p-[2px] border border-secondary-foreground text-center text-[10px]">
              Plugin ID
            </th>
            <th className="p-[2px] border border-secondary-foreground text-center text-[10px]">
              User Name
            </th>
            <th className="p-[2px] border border-secondary-foreground text-center text-[10px]">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {plugins.slice(0, 5).map((plugin, index) => (
            <tr key={index}>
              <td className="p-[2px] border border-secondary-foreground text-center text-secondary-foreground text-[10px]">
                {plugin.id}
              </td>
              <td className="p-[2px] border border-secondary-foreground text-center text-secondary-foreground text-[10px]">
                {plugin.userName}
              </td>
              <td className="p-[2px] border border-secondary-foreground text-center text-secondary-foreground text-[10px]">
                <button
                  className="bg-primary text-white px-[5px] py-[2px] cursor-pointer rounded-[5px] text-[10px] hover:bg-secondary"
                  onClick={pluginActivity}
                >
                  Get Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {plugins.length > 5 && (
        <button
          className="w-[30%] bg-primary text-white border-none p-[5px] mt-[10px] cursor-pointer rounded-[4px] text-[12px] hover:bg-secondary"
          onClick={handleViewMoreClick}
        >
          View More
        </button>
      )}
    </div>
  );
};

export default Details;
