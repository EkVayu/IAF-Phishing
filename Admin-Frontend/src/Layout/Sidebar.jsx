import React from "react";
import { Link, useLocation } from "react-router-dom";
import logoTop from "./../assets/IAF_logo.jpg";
import logoBottom from "./../assets/logo.jpeg";
import { useAuth } from "../context/AuthContext";
import { MdDashboard, MdVpnKey } from "react-icons/md";
import { IoMdPeople } from "react-icons/io";
import { FaPlug } from "react-icons/fa";
import { MdSpaceDashboard } from "react-icons/md";
import { TbReportSearch } from "react-icons/tb";
import { CgProfile } from "react-icons/cg";
import { IoIosChatboxes } from "react-icons/io";
import { MessageSquareLock } from "lucide-react";
import { IoCall } from "react-icons/io5";
import { GiRogue } from "react-icons/gi";
import { IoMdSettings } from "react-icons/io";
import { SiRtlzwei } from "react-icons/si";
import { GoLaw } from "react-icons/go";
import { MdOutlineReportProblem } from "react-icons/md";

const superadminMenuItems = [
  { title: "Dashboard", path: "/", icon: <MdDashboard className="text-xl" /> },
  { title: "Users", path: "/users", icon: <IoMdPeople className="text-xl" /> },
  {
    title: "Licenses",
    path: "/licenses",
    icon: <MdVpnKey className="text-xl" />,
  },
  {
    title: "Profile",
    path: "/profile",
    icon: <CgProfile className="text-xl" />,
  },
];

const staffMenuItems = [
  { title: "Dashboard", path: "/", icon: <MdDashboard className="text-xl" /> },
  {
    title: "Plugin",
    path: "/plugin",
    icon: <FaPlug className="text-xl" />,
  },
  {
    title: "Phishing",
    path: "/phishing-mails",
    icon: <MdOutlineReportProblem className="text-xl" />,
  },
  {
    title: "Disputes",
    path: "/disputes",
    icon: <GoLaw className="text-xl" />,
  },
  // {
  //   title: "CDR",
  //   path: "/cdr",
  //   icon: <MdSpaceDashboard className="text-xl" />,
  // },
  {
    title: "Reports",
    path: "/reports",
    icon: <TbReportSearch className="text-xl" />,
  },
  {
    title: "SandBox",
    path: "/sandbox",
    icon: <IoIosChatboxes className="text-xl" />,
  },
  {
    title: "Quarantine",
    path: "/quarantine",
    icon: <MessageSquareLock className="text-xl" />,
  },
  {
    title: "Rogue DB",
    path: "/rogue-db",
    icon: <GiRogue className="text-xl" />,
  },
  // { title: "SIRTs", path: "/sirts", icon: <SiRtlzwei className="text-xl" /> },
  {
    title: "Profile",
    path: "/profile",
    icon: <CgProfile className="text-xl" />,
  },
  {
    title: "Settings",
    path: "/settings",
    icon: <IoMdSettings className="text-xl" />,
  },
  {
    title: "Contact",
    path: "/contact",
    icon: <IoCall className="text-xl" />,
  },
];

function Sidebar() {
  const { role } = useAuth();
  // const role = "superuser";
  const location = useLocation();
  const menuItems = role === "superuser" ? superadminMenuItems : staffMenuItems;
  return (
    <div className="w-full h-screen bg-primary dark:bg-gray-800 text-white flex flex-col px-6">
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
                className={`flex items-center gap-3 px-4 rounded-md py-2 text-sm hover:bg-secondary dark:hover:bg-gray-700 transition duration-150 ease-in-out tracking-widest ${
                  location.pathname === item.path
                    ? "bg-secondary dark:bg-gray-700"
                    : ""
                }`}
              >
                {item.icon}
                <span>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="pb-3 mt-3 px-3">
        <img
          src={logoBottom}
          alt="Bottom logo"
          className="w-16 h-16 rounded-lg"
        />
      </div>
    </div>
  );
}

export default Sidebar;
