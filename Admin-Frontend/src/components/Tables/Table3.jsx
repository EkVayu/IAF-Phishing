import React, { useState, useMemo } from "react";
import {
  FaSearch,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { IoFilterSharp } from "react-icons/io5";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import LoaderComponent from "../Common/LoaderComponent";

function DateFormatter({ dateString }) {
  const formatDate = (dateString) => {
    if (!dateString || dateString === "null" || dateString === "undefined") {
      return "-";
    }

    const date = new Date(dateString);

    // Check if date is invalid
    if (isNaN(date.getTime())) {
      return "-";
    }

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12;
    hours = hours.toString().padStart(2, "0");

    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
  };

  return <span>{formatDate(dateString)}</span>;
}

const Table3 = ({
  data,
  columns,
  onAction,
  loading,
  error,
  itemsPerPage = 10,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showColumnToggle, setShowColumnToggle] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(
    Object.fromEntries(columns.map((col) => [col.accessor, true]))
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingRow, setUpdatingRow] = useState(null);

  const filteredData = useMemo(() => {
    return data.filter((row) =>
      columns.some((column) =>
        String(row[column.accessor])
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
    );
  }, [data, columns, searchTerm]);

  const toggleColumnVisibility = (accessor) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [accessor]: !prev[accessor],
    }));
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
    <div className="w-full">
      <div className="p-4 flex justify-between items-center bg-indigo-100 dark:bg-gray-800 rounded-t-md">
        <h2 className="text-xl font-semibold text-primary dark:text-white">
          Data List
        </h2>
        <div className="flex items-center">
          <div className="relative max-w-sm mr-4">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-12 pr-10 text-gray-700 dark:text-white bg-background border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-300 ease-in-out"
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
              className="bg-background text-primary dark:text-white px-4 py-2 rounded-lg shadow shadow-black/10 flex items-center gap-2"
              onClick={() => setShowColumnToggle(!showColumnToggle)}
            >
              <IoFilterSharp className="h-5 w-5" />
              Filter
            </button>
            {showColumnToggle && (
              <div className="absolute right-0 bg-background rounded-lg border shadow-lg mt-2 p-2 min-w-40 z-10">
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
      </div>
      <ScrollArea className="bg-background">
        <table className="min-w-full">
          {loading ? (
            <LoaderComponent />
          ) : error ? (
            <div className="w-full py-5 px-3 bg-background dark:bg-gray-800">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <>
              <thead>
                <tr className="bg-indigo-200 dark:bg-gray-700 dark:text-white text-primary">
                  {columns
                    ?.filter((col) => visibleColumns[col.accessor])
                    ?.map((column) => (
                      <th
                        key={column.accessor}
                        className="py-3 px-4 text-center"
                      >
                        {column.Header}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData?.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="border hover:bg-gray-200 dark:hover:bg-gray-900 text-secondary-foreground"
                  >
                    {columns
                      .filter((col) => visibleColumns[col.accessor])
                      .map((column) => (
                        <td
                          key={column.accessor}
                          className="py-2 px-4 text-center"
                        >
                          {column.accessor === "actions" ? (
                            <div className="flex items-center justify-center">
                              {updatingRow === row.license_id ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary my-[9px]"></div>
                              ) : (
                                column.cell(row, (id, action) =>
                                  onAction(id, action, setUpdatingRow)
                                )
                              )}
                            </div>
                          ) : column.accessor.includes("date") ||
                            column.accessor.includes("from") ||
                            column.accessor.includes("till") ? (
                            <DateFormatter dateString={row[column.accessor]} />
                          ) : (
                            row[column.accessor]
                          )}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </table>
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
              className="p-2 disabled:bg-gray-300 bg-primary hover:bg-blue-600 text-white disabled:text-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <FaChevronLeft />
            </button>
            {renderPaginationButtons()}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="p-2 disabled:bg-gray-300 bg-primary hover:bg-blue-600 text-white disabled:text-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table3;
