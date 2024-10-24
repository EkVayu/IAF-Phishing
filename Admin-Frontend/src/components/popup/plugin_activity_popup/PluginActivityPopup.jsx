import React, { useState } from "react";
import { Button } from "../../ui/button";
import { X } from "lucide-react";
import { FaCaretLeft } from "react-icons/fa";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ScrollArea } from "@/components/ui/scroll-area";

function PluginActivityPopup({ onClose }) {
  const [stage, setStage] = useState(1);
  const [selectedExtension, setSelectedExtension] = useState(null);

  const truncatePluginId = (id, maxLength = 8) => {
    if (id.length <= maxLength) return id;
    return `${id.substring(0, maxLength)}...`;
  };

  const disabledExtensions = [
    {
      id: 1,
      pluginId: "hi9876trdfcgvhyu765esdxokiu65rdcvhui",
      userName: "User 1",
      lastActive: "2 days ago",
      status: "Disabled",
      description: "Helps optimize your website for search engines",
    },
    {
      id: 2,
      pluginId: "hi9876trdfcgvhyu765esdxokiu65rdcvhui87",
      userName: "User 2",
      lastActive: "5 hours ago",
      status: "Disabled",
      description: "Tracks website performance and user behavior",
    },
    {
      id: 3,
      pluginId: "nkoi98y7tfgvhuy765resdxftr54w3a",
      userName: "User 3",
      lastActive: "1 week ago",
      status: "Disabled",
      description: "Scans for vulnerabilities and security issues",
    },
  ];

  const renderHeader = (title) => (
    <div className="flex items-center px-3 bg-red-500 rounded-t-md h-8">
      <div className="w-full flex items-center justify-between gap-2">
        {stage > 1 && (
          <button
            className="text-white shadow-none px-2 py-1 rounded-md"
            onClick={() => setStage(stage - 1)}
          >
            <FaCaretLeft className="h-4 w-4" />
          </button>
        )}
        <h3 className="text-md font-semibold text-white text-center w-full">
          {title}
        </h3>
        <button className="text-white" onClick={onClose}>
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const renderStage1 = () => (
    <>
      {renderHeader("Plugins Status")}
      <div className="text-center p-4 text-secondary-foreground">
        <p className="text-muted-foreground mb-4">
          In last{" "}
          <strong className="text-secondary-foreground">{"15"} Minutes</strong>{" "}
          total{" "}
          <strong className="text-secondary-foreground">
            {disabledExtensions.length} Plugins
          </strong>{" "}
          are Disabled
        </p>

        <Button
          variant="default"
          size={"sm"}
          className="w-1/3 text-sm text-white"
          onClick={() => setStage(2)}
        >
          View All
        </Button>
      </div>
    </>
  );

  const renderStage2 = () => (
    <>
      {renderHeader("Disabled Plugin List")}
      <div className="text-secondary-foreground">
        <ScrollArea className="h-[200px] border-none">
          <table className="w-full border-collapse">
            <thead className="bg-primary text-[10px] text-white">
              <tr>
                <th className="py-1 px-2 text-center font-medium border">
                  Plugin Id
                </th>
                <th className="py-1 px-2 text-center font-medium border">
                  User Name
                </th>
                <th className="py-1 px-2 text-center font-medium border">
                  Last Active
                </th>
                <th className="py-1 px-2 text-center font-medium border">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="text-[10px]">
              {disabledExtensions.map((ext, index) => (
                <tr key={ext.id}>
                  <td className="py-1 px-2 text-center text-secondary-foreground border relative group">
                    <span className="cursor-pointer">
                      {truncatePluginId(ext.pluginId)}
                      {ext.pluginId.length > 8 && (
                        <div className="absolute hidden group-hover:block bg-black text-white dark:bg-white dark:text-black p-2 rounded text-xs -top-8 -right-52  transform whitespace-nowrap z-10">
                          {ext.pluginId}
                        </div>
                      )}
                    </span>
                  </td>
                  <td className="py-1 px-2 text-center text-secondary-foreground border">
                    {ext.userName}
                  </td>
                  <td className="py-1 px-2 text-center text-secondary-foreground border">
                    {ext.lastActive}
                  </td>
                  <td className="py-1 px-2 text-center border">
                    <button
                      className="text-[10px] bg-primary px-2 py-1 rounded-md text-white"
                      onClick={() => {
                        setSelectedExtension(ext);
                        setStage(3);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </div>
      <Link
        to={"/plugin"}
        className="w-full flex items-center justify-center my-2"
      >
        <button className="text-[10px] px-2 py-1 bg-primary rounded-md cursor-pointer text-white">
          View more
        </button>
      </Link>
    </>
  );

  const renderStage3 = () => (
    <>
      {renderHeader("Plugin Details")}
      <div className="text-secondary-foreground">
        {selectedExtension && (
          <div className="space-y-3">
            <div className="p-4 border rounded-md bg-card">
              <div className="flex justify-between items-center mb-3">
                <span className="">Plugin Id:</span>
                <div className="relative group flex items-center gap-2">
                  <span className="cursor-pointer font-medium">
                    {truncatePluginId(selectedExtension.pluginId)}
                    {selectedExtension.pluginId.length > 8 && (
                      <div className="absolute hidden group-hover:block bg-black text-white dark:bg-white dark:text-black p-2 rounded text-xs -top-8 right-0 transform whitespace-nowrap z-10">
                        {selectedExtension.pluginId}
                      </div>
                    )}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-6"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedExtension.pluginId);
                      toast.success("Copied to clipboard");
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect
                        x="9"
                        y="9"
                        width="13"
                        height="13"
                        rx="2"
                        ry="2"
                      ></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="">Status:</span>
                  <span className="text-xs px-2 py-1 bg-destructive/10 text-destructive dark:bg-destructive dark:text-white rounded-full">
                    {selectedExtension.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="">User:</span>
                  <span className="font-medium">
                    {selectedExtension.userName}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="">Last Active:</span>
                  <span>{selectedExtension.lastActive}</span>
                </div>

                <div className="flex justify-between gap-5">
                  <span className="">Description:</span>
                  <span className=" text-right">
                    {selectedExtension.description}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-background border rounded-lg shadow-lg">
      {stage === 1 && renderStage1()}
      {stage === 2 && renderStage2()}
      {stage === 3 && renderStage3()}
    </div>
  );
}

export default PluginActivityPopup;
