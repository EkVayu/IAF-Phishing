import React from "react";
import { Link, useLocation } from "react-router-dom";
import logoTop from "./../assets/IAF_logo.jpg";
import logoBottom from "./../assets/logo.jpeg";
import { useAuth } from "../context/AuthContext";

const superadminMenuItems = [
  { title: "Dashboard", path: "/" },
  { title: "Users", path: "/users" },
  { title: "Licenses", path: "/licenses" },
];

const staffMenuItems = [
  { title: "Dashboard", path: "/" },
  { title: "Plugin", path: "/plugin" },
  { title: "Phishing", path: "/phishing-mails" },
  { title: "CDR", path: "/cdr" },
  { title: "Reports", path: "/reports" },
  { title: "Profile", path: "/profile" },
  { title: "SandBox", path: "/sandbox" },
  { title: "Quarantine", path: "/quarantine" },
  { title: "Contact", path: "/contact" },
  { title: "Rogue DB", path: "/rogue-db" },
  { title: "SIRTs", path: "/sirts" },
  { title: "Settings", path: "/settings" },
];

function Sidebar() {
  const { role } = useAuth();
  // const role = "superuser";
  const location = useLocation();
  const menuItems = role === "superuser" ? superadminMenuItems : staffMenuItems;
  return (
    <div className="w-full h-screen bg-primary text-background flex flex-col px-6">
      <div className="pt-4 px-3">
        <img
          src={logoTop}
          alt="Top Logo"
          className="w-16 h-16 rounded-full mb-3"
        />
      </div>
      <nav className="flex-grow">
        <ul className="space-y-1">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                to={item.path}
                className={`block px-4 rounded-lg py-2 text-sm hover:bg-secondary transition duration-150 ease-in-out ${
                  location.pathname === item.path ? "bg-secondary" : ""
                }`}
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="pb-3 mt-3 px-3">
        <img src={logoBottom} alt="Bottom logo" className="w-16 h-16" />
      </div>
    </div>
  );
}

export default Sidebar;
