import React, { useState, useMemo } from "react";
import DateFormatter from "../../Common/DateFormatter";

const LicenseHistoryModal = ({ history, onClose, licenseId }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredHistory = useMemo(() => {
    return history.filter((entry) =>
      entry.allocatedEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [history, searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 cursor-pointer">
      <div className="bg-background rounded-lg shadow-lg p-6 w-4/5 max-w-2xl max-h-[80vh] overflow-y-auto scroll-smooth">
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
          <h2 className="text-gray-800 text-2xl font-semibold w-full md:w-auto">
            <span className="text-primary">{licenseId}</span>: License Report
          </h2>
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder="Search by email..."
              className="w-full md:w-64 border-2 border-gray-300 rounded-full py-2 px-4 pl-10 focus:outline-none focus:border-primary transition duration-300"
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
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr>
              <th className="border border-gray-300 p-3 text-left bg-gray-100 font-bold text-gray-800">
                Sr. No.
              </th>
              <th className="border border-gray-300 p-3 text-left bg-gray-100 font-bold text-gray-800">
                Allocated Email
              </th>
              <th className="border border-gray-300 p-3 text-left bg-gray-100 font-bold text-gray-800">
                User Till
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory?.map((entry, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                <td className="border border-gray-300 p-3">{entry?.srNo}</td>
                <td className="border border-gray-300 p-3">
                  {entry?.allocatedEmail}
                </td>
                <td className="border border-gray-300 p-3">
                  <DateFormatter dateString={entry?.userTill} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={onClose}
          className="bg-green-500 text-background py-2 px-4 rounded text-base cursor-pointer transition duration-300 hover:bg-green-600 float-right"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default LicenseHistoryModal;
