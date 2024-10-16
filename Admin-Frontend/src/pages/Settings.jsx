import React from "react";
import { Moon, Sun } from "lucide-react";
import { FaComputer } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/context/theme-provider";

function Settings() {
  const { setTheme, theme } = useTheme();
  return (
    <div className="w-full h-[80vh] bg-background">
      <div className="h-full w-full">
        <div className="p-8 w-full h-full">
          <h1 className="text-4xl font-bold text-primary mb-6">Settings</h1>
          <div className="space-y-8 flex flex-col justify-between w-full h-[65vh]">
            <div className="space-y-6">
              {/* <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <FiGlobe className="text-2xl text-primary" />
                  <label className="text-sm font-medium text-secondary-foreground">
                    Language
                  </label>
                </div>
                <select className="p-2 border text-secondary-foreground bg-transparent border-primary dark:border-white rounded-md focus:ring-0 transition">
                  <option value="en" className="dark:text-white dark:bg-black">
                    English
                  </option>
                  <option value="es" className="dark:text-white dark:bg-black">
                    Español
                  </option>
                  <option value="fr" className="dark:text-white dark:bg-black">
                    Français
                  </option>
                  <option value="de" className="dark:text-white dark:bg-black">
                    Deutsch
                  </option>
                </select>
              </div> */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {theme === "light" ? (
                    <Sun className="text-2xl text-primary" />
                  ) : theme === "dark" ? (
                    <Moon className="text-2xl text-primary" />
                  ) : (
                    <FaComputer className="text-2xl text-primary" />
                  )}
                  <span className="text-sm font-medium text-secondary-foreground">
                    {theme === "light"
                      ? "Light Theme"
                      : theme === "dark"
                      ? "Dark Theme"
                      : "System Theme"}
                  </span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-secondary-foreground text-secondary-foreground outline-none ring-offset-0 focus-visible:outline-none focus-visible:ring-0 flex items-center gap-2"
                    >
                      {theme === "light" ? (
                        <Sun className="h-[1.2rem] w-[1.2rem]" />
                      ) : theme === "dark" ? (
                        <Moon className="h-[1.2rem] w-[1.2rem]" />
                      ) : (
                        <FaComputer className="h-[1.2rem] w-[1.2rem]" />
                      )}
                      <span className="">Toggle theme</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      Light
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      Dark
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>
                      System
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
