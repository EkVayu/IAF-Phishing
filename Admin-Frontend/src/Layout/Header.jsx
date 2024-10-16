import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import userIcon from "../assets/user.png";
import LogoutPopup from "../components/logpopup/LogoutPopup";
import ChangePassword from "../components/popup/ChangePassword/ChangePassword";
import NotificationPopup from "../components/notificationPopup/NotificationPopup";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { FaAngleDown, FaBell, FaRegEdit } from "react-icons/fa";
import { RiLockPasswordFill } from "react-icons/ri";
import { HiArrowLeftStartOnRectangle } from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/context/theme-provider";
import { Moon, Sun } from "lucide-react";
import { FaComputer } from "react-icons/fa6";

const Header = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [changePasswordPopup, setChangePasswordPopup] = useState(false);
  const menuRef = useRef();
  const triggerRef = useRef();
  const [open, setOpen] = useState(false);
  const { user, role } = useAuth();
  const { setTheme, theme } = useTheme();

  const handleClick = () => {
    setChangePasswordPopup(false);
    setOpen(true);
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  const notifications = [
    "Notification 1",
    "Notification 2",
    "Notification 3",
    "Notification 4",
    "Notification 5",
    "Notification 6",
    "Notification 7",
    "Notification 8",
    "Notification 9",
    "Notification 10",
    "Notification 11",
    "Notification 12",
  ];

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleChangePasswordPopup = () => {
    setChangePasswordPopup(true);
    setIsDropdownOpen(false);
  };

  const handleLogoutPopup = () => {
    setShowLogoutPopup(true);
    setIsDropdownOpen(false);
  };

  const closeLogoutPopup = () => {
    setShowLogoutPopup(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="w-full h-16 flex items-center justify-between px-6 dark:border-b">
      <div className="w-full">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-primary via-white to-secondary text-transparent bg-clip-text">
          Indian Air Force
        </h3>
      </div>
      <div className="w-full flex items-center justify-end gap-5">
        {role === "staff" && (
          <div className="relative cursor-pointer">
            <NotificationPopup notifications={notifications} />
          </div>
        )}
        {role === "superuser" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="text-secondary-foreground bg-gray-200 dark:bg-gray-800 outline-none ring-offset-0 focus-visible:outline-none focus-visible:ring-0 flex items-center gap-2 h-[44px]"
              >
                {theme === "light" ? (
                  <Sun className="h-[1.2rem] w-[1.2rem]" />
                ) : theme === "dark" ? (
                  <Moon className="h-[1.2rem] w-[1.2rem]" />
                ) : (
                  <FaComputer className="h-[1.2rem] w-[1.2rem]" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setTheme("light")}
                className="cursor-pointer border-b"
              >
                Light
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("dark")}
                className="cursor-pointer border-b"
              >
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("system")}
                className="cursor-pointer"
              >
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div
          className="flex items-center cursor-pointer select-none bg-gray-200 dark:bg-gray-800 rounded-md px-2 py-1"
          onClick={toggleDropdown}
          ref={triggerRef}
        >
          <img
            src={user?.profile || userIcon}
            alt="user icon"
            className="mr-[6px] w-[25px] h-[25px]"
          />
          <div className="mr-2 flex gap-2">
            <div className="">
              <h5 className="text-sm font-medium capitalize text-secondary-foreground">
                {user?.username || "Username"}
              </h5>
              <h6 className="text-xs text-gray-600 capitalize text-secondary-foreground">
                {role || "Role"}
              </h6>
            </div>
            <div className="cursor-pointer">
              <FaAngleDown
                className={`w-5 h-5 text-secondary-foreground ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>
        </div>
        <div className="relative">
          {isDropdownOpen && (
            <div
              className="absolute top-[40px] right-0 z-[1000] w-[200px] p-2 bg-background shadow-md dark:shadow-sm shadow-black dark:shadow-white rounded-md text-sm"
              ref={menuRef}
            >
              <ul className="flex flex-col gap-2">
                {role === "staff" && (
                  <li className="flex items-center p-[7px_10px] cursor-pointer  hover:bg-gray-300 dark:hover:bg-gray-800 text-secondary-foreground rounded-md">
                    <FaRegEdit className="mr-[10px] w-[18px] h-[18px]" />
                    <Link to="/edit-profile" className="no-underline text-sm">
                      Edit Profile
                    </Link>
                  </li>
                )}
                {role === "staff" && (
                  <li
                    className="flex items-center p-[7px_10px] cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-800 text-secondary-foreground rounded-md"
                    onClick={handleChangePasswordPopup}
                  >
                    <RiLockPasswordFill className="mr-[10px] w-[18px] h-[18px]" />
                    <Link to="#" className="no-underline text-sm">
                      Change Password
                    </Link>
                  </li>
                )}
                <li
                  className="flex items-center p-[7px_10px] cursor-pointer  hover:bg-gray-300 dark:hover:bg-gray-800 text-red-500 rounded-md"
                  onClick={handleLogoutPopup}
                >
                  <HiArrowLeftStartOnRectangle className="mr-[10px] w-[18px] h-[18px]" />
                  <Link to="#" className="no-underline text-sm">
                    Logout
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>

        {showLogoutPopup && <LogoutPopup onClose={closeLogoutPopup} />}

        {changePasswordPopup && (
          <ChangePassword
            onClose={() => setChangePasswordPopup(false)}
            Done={handleClick}
          />
        )}
        <Snackbar open={open} autoHideDuration={3000} onClose={handleClose}>
          <Alert
            onClose={handleClose}
            severity="success"
            variant="filled"
            sx={{ width: "100%" }}
          >
            Password change Request has been sent!
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
};

export default Header;
