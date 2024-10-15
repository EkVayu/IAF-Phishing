import React from "react";

const CardComponent = ({ icon, title, initialCount, onClick, isSelected }) => {
  return (
    <div
      className={`w-full h-32 flex justify-between p-4 rounded-lg bg-background shadow-md cursor-pointer transition-all duration-300 ${
        isSelected ? "ring-2 ring-primary" : "hover:shadow-lg"
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col justify-between">
        <h5 className="text-sm text-gray-600">{title}</h5>
        <h2 className="text-3xl font-bold">{initialCount.toLocaleString()}</h2>
      </div>
      {icon}
    </div>
  );
};

export default CardComponent;
