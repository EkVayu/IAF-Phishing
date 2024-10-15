import React from "react";
<<<<<<< HEAD
import { MdNotifications, MdClear } from "react-icons/md";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const NotificationPopup = ({ notifications }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          className="bg-gray-200 dark:bg-gray-800 relative hover:bg-gray-300 dark:hover:bg-gray-700"
        >
          <MdNotifications className="h-5 w-5 text-secondary-foreground" />
          {notifications.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 select-none text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {notifications.length > 99 ? "99+" : notifications.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0">
        <div className="bg-primary text-white p-2">
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No new notifications
            </p>
          ) : (
            notifications.map((notification, index) => (
              <DropdownMenuItem
                key={index}
                className="flex justify-between items-center"
              >
                <span>{notification}</span>
                <MdClear className="h-4 w-4 text-muted-foreground hover:text-destructive cursor-pointer" />
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
=======
import { MdCancel, MdNotifications, MdClear } from "react-icons/md";

const NotificationPopup = ({ notifications, onClose, onClearNotification }) => {
  return (
    <div className="fixed top-16 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="flex items-center justify-between bg-blue-600 dark:bg-blue-800 text-white px-4 py-3">
        <div className="flex items-center space-x-2">
          <MdNotifications className="text-xl" />
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>
        <MdCancel
          className="text-2xl cursor-pointer hover:text-gray-200 transition-colors"
          onClick={onClose}
        />
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No new notifications
          </p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification, index) => (
              <li
                key={index}
                className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <p className="text-gray-800 dark:text-gray-200 flex-grow">
                    {notification}
                  </p>
                  <MdClear
                    className="text-gray-500 hover:text-red-500 cursor-pointer ml-2 flex-shrink-0"
                    onClick={() => onClearNotification(index)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
>>>>>>> 068ae200d36dc9e91c7d40e7b4847434738a876e
  );
};

export default NotificationPopup;
