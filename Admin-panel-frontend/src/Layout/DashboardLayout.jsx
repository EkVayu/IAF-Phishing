import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

const DashboardLayout = ({ children }) => {
  return (
    <div className="w-full">
      <div className="w-full flex">
        <div className="w-[16vw] sticky top-0 h-screen overflow-hidden">
          <Sidebar />
        </div>
        <div className="w-[84vw]">
          <Header />
          <main className="bg-foreground min-h-[85%] px-6 py-4">{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
