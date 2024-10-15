import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import userIcon from "../assets/user.png";
import LogoutPopup from "../components/logpopup/LogoutPopup";
<<<<<<< HEAD
import ChangePassword from "../components/popup/ChangePassword/ChangePassword";
import NotificationPopup from "../components/notificationPopup/NotificationPopup";
=======
import NotificationPopup from "../components/notificationPopup/NotificationPopup";
import ChangePassword from "../components/popup/ChangePassword/ChangePassword";
>>>>>>> 068ae200d36dc9e91c7d40e7b4847434738a876e
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { FaAngleDown, FaBell, FaRegEdit } from "react-icons/fa";
import { RiLockPasswordFill } from "react-icons/ri";
import { HiArrowLeftStartOnRectangle } from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";

<<<<<<< HEAD
const Header = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
=======
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
>>>>>>> 068ae200d36dc9e91c7d40e7b4847434738a876e
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
<<<<<<< HEAD
    "Notification 6",
    "Notification 7",
    "Notification 8",
    "Notification 9",
    "Notification 10",
    "Notification 11",
    "Notification 12",
=======
>>>>>>> 068ae200d36dc9e91c7d40e7b4847434738a876e
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

<<<<<<< HEAD
=======
  const handleBellClick = () => {
    setShowNotificationPopup(!showNotificationPopup);
  };

>>>>>>> 068ae200d36dc9e91c7d40e7b4847434738a876e
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
        <h3 className="text-2xl font-semibold text-secondary-foreground">
          Company Name
        </h3>
      </div>
      <div className="w-full flex items-center justify-end gap-5">
<<<<<<< HEAD
        <div className="relative cursor-pointer">
          <NotificationPopup notifications={notifications} />
        </div>
        <div
          className="flex items-center cursor-pointer select-none bg-gray-200 dark:bg-gray-800 rounded-md px-2 py-1"
=======
        <div className="relative cursor-pointer" onClick={handleBellClick}>
          <FaBell className="w-[18px] h-[18px] text-secondary-foreground" />
          <NotificationBadge count={notificationCount} />
        </div>
        <div
          className="flex items-center cursor-pointer select-none bg-gray-200 dark:bg-transparent rounded-md px-2 py-1"
>>>>>>> 068ae200d36dc9e91c7d40e7b4847434738a876e
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
                <li className="flex items-center p-[7px_10px] cursor-pointer  hover:bg-gray-300 dark:hover:bg-gray-800 text-secondary-foreground rounded-md">
                  <FaRegEdit className="mr-[10px] w-[18px] h-[18px]" />
                  <Link to="/edit-profile" className="no-underline text-sm">
                    Edit Profile
                  </Link>
                </li>
                <li
                  className="flex items-center p-[7px_10px] cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-800 text-secondary-foreground rounded-md"
                  onClick={handleChangePasswordPopup}
                >
                  <RiLockPasswordFill className="mr-[10px] w-[18px] h-[18px]" />
                  <Link to="#" className="no-underline text-sm">
                    Change Password
                  </Link>
                </li>
                <li
                  className="flex items-center p-[7px_10px] cursor-pointer  hover:bg-gray-300 dark:hover:bg-gray-800 text-secondary-foreground rounded-md"
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
<<<<<<< HEAD
        {/* {showNotificationPopup && (
=======
        {showNotificationPopup && (
>>>>>>> 068ae200d36dc9e91c7d40e7b4847434738a876e
          <NotificationPopup
            notifications={notifications}
            onClose={() => setShowNotificationPopup(false)}
          />
<<<<<<< HEAD
        )} */}
=======
        )}
>>>>>>> 068ae200d36dc9e91c7d40e7b4847434738a876e
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
