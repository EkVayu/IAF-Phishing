import React from "react";
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
  );
};

export default NotificationPopup;
