import React, { useState, useMemo } from "react";
import DateFormatter from "../../Common/DateFormatter";

const LicenseHistoryModal = ({ history, onClose, licenseId }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredHistory = useMemo(() => {
    if (typeof history === "string") {
      return [];
    }
    return history.filter((entry) =>
      entry.allocated_to.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [history, searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handlePrint = () => {
    const printContent = document.getElementById(
      "license-history-table"
    ).outerHTML;
    const windowPrint = window.open("", "", "height=500,width=800");
    windowPrint.document.write("<html><head><title>License History</title>");
    windowPrint.document.write(
      "<style>table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid black; padding: 8px; text-align: left; }</style>"
    );
    windowPrint.document.write("</head><body>");
    windowPrint.document.write(printContent);
    windowPrint.document.write("</body></html>");
    windowPrint.document.close();
    windowPrint.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 cursor-pointer">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-4/5 max-w-4xl max-h-[80vh] overflow-y-auto scroll-smooth">
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
          <h2 className="text-gray-800 dark:text-white text-xl font-semibold w-full md:w-auto">
            License Id -
            <span className="text-primary text-2xl">{licenseId}</span> : Report
          </h2>
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder="Search by email..."
              className="w-full md:w-64 border-2 border-gray-300 rounded-full py-2 px-4 pl-10 focus:outline-none focus:border-primary transition duration-300 text-secondary-foreground dark:bg-gray-800"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
        </div>
        {typeof history === "string" ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            No history data available for this license
          </div>
        ) : (
          <table
            id="license-history-table"
            className="w-full border-collapse mb-4"
          >
            <thead>
              <tr className="bg-primary text-white">
                <th className="border border-gray-300 p-3 text-left font-bold">
                  Sr. No.
                </th>
                <th className="border border-gray-300 p-3 text-left font-bold">
                  Allocated To
                </th>
                <th className="border border-gray-300 p-3 text-left font-bold">
                  Allocation Date
                </th>
                <th className="border border-gray-300 p-3 text-left font-bold">
                  Revoke Date
                </th>
                <th className="border border-gray-300 p-3 text-left font-bold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory?.map((entry, index) => (
                <tr key={index} className={"text-secondary-foreground text-sm"}>
                  <td className="border border-gray-300 p-3">{index + 1}</td>
                  <td className="border border-gray-300 p-3">
                    {entry.allocated_to}
                  </td>
                  <td className="border border-gray-300 p-3">
                    <DateFormatter dateString={entry.allocation_date} />
                  </td>
                  <td className="border border-gray-300 p-3">
                    {entry.revoke_date ? (
                      <DateFormatter dateString={entry.revoke_date} />
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="border border-gray-300 p-3">{entry.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="flex justify-end gap-4">
          {typeof !history === "string" && (
            <button
              onClick={handlePrint}
              className="bg-blue-500 text-white py-2 px-4 rounded text-base cursor-pointer transition duration-300 hover:bg-blue-600"
            >
              Print
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-red-500 text-white py-2 px-4 rounded text-base cursor-pointer transition duration-300 hover:bg-red-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LicenseHistoryModal;
