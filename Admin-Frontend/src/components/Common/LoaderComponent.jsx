import React from "react";

function LoaderComponent() {
  return (
    <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-lg">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary dark:border-white"></div>
    </div>
  );
}

export default LoaderComponent;
