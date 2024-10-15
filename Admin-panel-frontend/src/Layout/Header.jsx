import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import userIcon from "../assets/user.png";
import LogoutPopup from "../components/logpopup/LogoutPopup";
import NotificationPopup from "../components/notificationPopup/NotificationPopup";
import ChangePassword from "../components/popup/ChangePassword/ChangePassword";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { FaAngleDown, FaBell, FaRegEdit } from "react-icons/fa";
import { RiLockPasswordFill } from "react-icons/ri";
import { HiArrowLeftStartOnRectangle } from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";

function NotificationBadge({ count }) {
  return (
    <div className="absolute -top-[14px] -right-[3px] bg-red-500 text-background rounded-full px-[2px] text-[10px] max-h-fit max-w-[80%]">
      {count > 9 ? "9+" : count}
    </div>
  );
}

const Header = () => {
  const notificationCount = 50;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [changePasswordPopup, setChangePasswordPopup] = useState(false);
  const menuRef = useRef();
  const triggerRef = useRef();
  const [open, setOpen] = useState(false);
  const { user, role } = useAuth();

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

  const handleBellClick = () => {
    setShowNotificationPopup(!showNotificationPopup);
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
    <div className="w-full h-16 flex items-center justify-between px-6">
      <div className="w-full">
        <h3 className="text-2xl font-bold">Company Name</h3>
      </div>
      <div className="w-full flex items-center justify-end gap-5">
        <div className="relative cursor-pointer" onClick={handleBellClick}>
          <FaBell className="w-[18px] h-[18px]" />
          <NotificationBadge count={notificationCount} />
        </div>
        <div
          className="flex items-center cursor-pointer select-none bg-gray-200 rounded-md px-2 py-1"
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
              <h5 className="text-sm font-medium capitalize">
                {user?.username || "Username"}
              </h5>
              <h6 className="text-xs text-gray-600 capitalize">
                {role || "Role"}
              </h6>
            </div>
            <div className="cursor-pointer">
              <FaAngleDown
                className={`w-5 h-5 ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </div>
          </div>
        </div>
        <div className="relative">
          {isDropdownOpen && (
            <div
              className="absolute top-[40px] right-0 z-[1000] w-[200px] p-2 bg-background shadow-md shadow-black rounded-md text-sm"
              ref={menuRef}
            >
              <ul className="flex flex-col gap-2">
                <li className="flex items-center p-[7px_10px] cursor-pointer hover:bg-gray-200 rounded-md">
                  <FaRegEdit className="mr-[10px] w-[18px] h-[18px]" />
                  <Link
                    to="/edit-profile"
                    className="text-gray-700 no-underline text-sm"
                  >
                    Edit Profile
                  </Link>
                </li>
                <li
                  className="flex items-center p-[7px_10px] cursor-pointer hover:bg-gray-200 rounded-md"
                  onClick={handleChangePasswordPopup}
                >
                  <RiLockPasswordFill className="mr-[10px] w-[18px] h-[18px]" />
                  <Link to="#" className="text-gray-700 no-underline text-sm">
                    Change Password
                  </Link>
                </li>
                <li
                  className="flex items-center p-[7px_10px] cursor-pointer hover:bg-gray-200 rounded-md"
                  onClick={handleLogoutPopup}
                >
                  <HiArrowLeftStartOnRectangle className="mr-[10px] w-[18px] h-[18px]" />
                  <Link to="#" className="text-gray-700 no-underline text-sm">
                    Logout
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>

        {showLogoutPopup && <LogoutPopup onClose={closeLogoutPopup} />}
        {showNotificationPopup && (
          <NotificationPopup
            notifications={notifications}
            onClose={() => setShowNotificationPopup(false)}
          />
        )}
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

