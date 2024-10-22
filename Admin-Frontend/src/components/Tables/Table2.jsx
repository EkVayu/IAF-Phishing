import React, { useState, useMemo } from "react";
import {
  FaSearch,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { IoFilterSharp } from "react-icons/io5";
import { FaDownload } from "react-icons/fa";
import DateFormatter from "../Common/DateFormatter";
import { toast } from "react-toastify";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const getStatusColor = (status) => {
  if (!status) return "bg-gray-200"; // Default color for undefined or null status
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-500";
    case "processing":
      return "bg-yellow-500";
    case "failed":
      return "bg-red-500";
    case "safe":
      return "bg-green-500 text-background";
    case "unsafe":
      return "bg-red-500 text-background";
    default:
      return "bg-gray-500";
  }
};

const getThreatScoreColor = (score) => {
  if (score >= 80) return "text-red-600 font-bold";
  if (score >= 60) return "text-orange-500 font-semibold";
  if (score >= 40) return "text-yellow-500";
  return "text-green-500";
};

function Table2({ data, columns, onStatusChange, loading, error }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({});
  const [showColumnToggle, setShowColumnToggle] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(
    Object.fromEntries(columns.map((col) => [col.accessor, true]))
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleStatusChange = (row, newStatus) => {
    const adminComment = prompt("Enter admin comment:");
    onStatusChange(
      row.recievers_email,
      row.message_id,
      adminComment,
      newStatus
    );
  };

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      return (
        columns.some((column) =>
          String(row[column.accessor])
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        ) &&
        Object.entries(filters).every(([key, value]) =>
          String(row[key]).toLowerCase().includes(value.toLowerCase())
        )
      );
    });
  }, [data, columns, searchTerm, filters]);

  const toggleColumnVisibility = (accessor) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [accessor]: !prev[accessor],
    }));
  };

  const handleDownload = (row) => {
    // Implement your download logic here
    toast.success(`Downloading data for message ID: ${row.message_id}`);
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderPaginationButtons = () => {
    const buttons = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        buttons.push(
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`px-3 py-1 mx-1 rounded ${
              currentPage === i
                ? "bg-primary text-white"
                : "bg-gray-200 text-black"
            }`}
          >
            {i}
          </button>
        );
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        buttons.push(<span key={i}>...</span>);
      }
    }
    return buttons;
  };

  return (
    <div className="container mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <div className="relative max-w-sm">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-12 pr-10 text-secondary-foreground bg-background border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-300 ease-in-out"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="relative">
          <button
            className="bg-background text-primary dark:text-white px-4 py-2 rounded-lg shadow shadow-black/10 dark:shadow-white flex items-center gap-2"
            onClick={() => setShowColumnToggle(!showColumnToggle)}
          >
            <IoFilterSharp className="h-5 w-5" />
            Filter
          </button>
          {showColumnToggle && (
            <div className="absolute right-0 bg-background rounded-lg border shadow-lg mt-2 p-2 min-w-52 z-10">
              <h1 className="mb-2 border-b text-secondary-foreground">
                Filter by
              </h1>
              {columns.map((column) => (
                <div key={column.accessor} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={column.accessor}
                    checked={visibleColumns[column.accessor]}
                    onChange={() => toggleColumnVisibility(column.accessor)}
                    className="mr-2"
                  />
                  <label
                    htmlFor={column.accessor}
                    className="text-secondary-foreground"
                  >
                    {column.Header}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ScrollArea className="rounded-t-lg">
        {loading ? (
          <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-lg">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary dark:border-white"></div>
          </div>
        ) : error ? (
          <div className="w-full py-5 px-3 bg-background dark:bg-gray-800 rounded-md">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="bg-primary dark:bg-gray-800">
                {columns
                  .filter((col) => visibleColumns[col.accessor])
                  .map((column) => (
                    <th
                      key={column.accessor}
                      className="px-4 py-3 text-center text-white uppercase text-xs border min-w-28"
                    >
                      {column.Header}
                    </th>
                  ))}
              </tr>
            </thead>

            <tbody className="bg-background">
              {paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border hover:bg-gray-200 dark:hover:bg-gray-900"
                >
                  {columns
                    .filter((col) => visibleColumns[col.accessor])
                    .map((column) => (
                      <td
                        key={column.accessor}
                        className="px-6 py-2 whitespace-nowrap text-center text-secondary-foreground text-sm"
                      >
                        {column.accessor === "status" ? (
                          row[column.accessor] === "safe" ||
                          row[column.accessor] === "unsafe" ? (
                            <select
                              value={row[column.accessor]}
                              onChange={(e) =>
                                handleStatusChange(row, e.target.value)
                              }
                              className={`px-2 py-1 leading-5 font-semibold rounded-md outline-none cursor-pointer ${getStatusColor(
                                row[column.accessor]
                              )} text-white`}
                            >
                              <option value="safe">Safe</option>
                              <option value="unsafe">Unsafe</option>
                            </select>
                          ) : (
                            <span
                              className={`px-2 py-1 leading-5 font-semibold rounded-md ${getStatusColor(
                                row[column.accessor]
                              )} text-white`}
                            >
                              {row[column.accessor]}
                            </span>
                          )
                        ) : column.accessor === "export" ? (
                          <button
                            onClick={() => handleDownload(row)}
                            className="bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-md inline-flex items-center"
                          >
                            <FaDownload className="mr-2" />
                            <span>Download</span>
                          </button>
                        ) : column.accessor === "threat_score" ? (
                          <span
                            className={getThreatScoreColor(
                              row[column.accessor]
                            )}
                          >
                            {row[column.accessor]}
                          </span>
                        ) : column.accessor.includes("started_on") ||
                          column.accessor.includes("completed_on") ? (
                          <DateFormatter dateString={row[column.accessor]} />
                        ) : (
                          row[column.accessor]
                        )}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <ScrollBar orientation="horizontal" className="" />
      </ScrollArea>
      {!error && !loading && (
        <div className="p-2 flex items-center justify-between bg-background dark:bg-gray-800 rounded-b-lg">
          <div className="text-secondary-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, filteredData.length)} of{" "}
            {filteredData.length}
          </div>
          <div className="flex items-center">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 disabled:bg-gray-300 bg-primary hover:bg-secondary text-white disabled:text-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <FaChevronLeft className="" />
            </button>
            {renderPaginationButtons()}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="p-2 disabled:bg-gray-300 bg-primary hover:bg-secondary text-white disabled:text-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <FaChevronRight className="" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table2;
