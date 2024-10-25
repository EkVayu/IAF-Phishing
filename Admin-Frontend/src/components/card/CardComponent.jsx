import React from "react";

const CardComponent = ({ icon, title, initialCount, onClick, isSelected }) => {

  return (
    <div
      className={`w-full h-32 flex justify-between p-4 bg-background dark:bg-gray-800 rounded-md shadow-md dark:shadow-white dark:shadow-sm cursor-pointer transition-all duration-300 ${
        isSelected ? "ring-2 ring-primary dark:ring-gray-600" : "hover:shadow-lg"
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col justify-between">
        <h5 className="text-sm text-secondary-foreground">{title}</h5>
        <h2 className="text-3xl font-bold text-secondary-foreground">
          {initialCount.toLocaleString()}
        </h2>
      </div>
      {icon}
    </div>
  );
};

export default CardComponent;
