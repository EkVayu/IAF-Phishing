import React, { useState, useMemo, useEffect } from "react";
import { useTable, usePagination, useSortBy } from "react-table";
import { GrFormNext, GrFormPrevious } from "react-icons/gr";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import LicenseForm from "../popup/licenseFormPopup/LicenseForm";
import DateFormatter from "../Common/DateFormatter";
import LicenseHistoryModal from "../popup/LicenseHistoryModal/LicenseHistoryModal";
import { licenseReportData } from "../../mockData";
import { toast } from "react-toastify";
import {
  allocateLicense,
  fetchLicensesHistory,
  revokeLicense,
} from "../../Api/api";
import { Close, Search } from "@mui/icons-material";
import { IoFilterSharp } from "react-icons/io5";
import { FaEye } from "react-icons/fa";

const Table = ({ tabData, loading, error, fetchLicensesData }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [showLicensePopup, setShowLicensePopup] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedLicenseHistory, setSelectedLicenseHistory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showColumnToggle, setShowColumnToggle] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState(
    tabData[activeTab]?.headers?.reduce((acc, header) => {
      acc[header.toLowerCase().replace(/ /g, "_")] = true;
      return acc;
    }, {})
  );

  useEffect(() => {
    setVisibleColumns(
      tabData[activeTab]?.headers?.reduce((acc, header) => {
        acc[header.toLowerCase().replace(/ /g, "_")] = true;
        return acc;
      }, {})
    );
  }, [activeTab, tabData]);

  const toggleColumnVisibility = (columnHeader) => {
    const key = columnHeader.toLowerCase().replace(/ /g, "_");
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleIssueClick = (row, buttonText) => {
    setShowLicensePopup(true);
    setSelectedRow({ ...row, buttonText });
  };

  const handleSubmit = async (email, licenseId) => {
    setShowLicensePopup(false);
    try {
      const response = await allocateLicense({
        allocated_to: email,
        license: licenseId,
      });

      if (!response.ok) {
        toast.error("Error allocating license");
        throw new Error("Network response was not ok");
      }
      toast.success("License allocated successfully");
      await fetchLicensesData();
    } catch (error) {
      toast.error("Error allocating license");
    }
  };

  const handleRevoke = async (email, licenseId) => {
    setShowLicensePopup(false);
    try {
      const response = await revokeLicense({
        allocated_to: email,
        license: licenseId,
      });

      if (!response.ok) {
        toast.error("Error revoking license");
      }
      toast.success("License revoked successfully");
      await fetchLicensesData();
    } catch (error) {
      toast.error("Error revoking license");
    }
  };

  const handliPrintHistory = async (licenseId) => {
    toast.success(`License: ${licenseId}, History printed successfully`);
  };

  const handleRowClick = async (event, licenseId) => {
    if (event?.target?.tagName === "BUTTON") {
      return; // Exit the function early if it's a button click
    }
    try {
      const response = await fetchLicensesHistory(licenseId);

      if (!response.ok) {
        toast.error("Network response was not ok");
      }
      const history = await response.json();
      // Check if history is empty or undefined
      if (!history || history.length === 0) {
        setSelectedLicenseHistory({
          licenseId: licenseId,
          history: [{ message: "No history available" }],
        });
      } else {
        setSelectedLicenseHistory({
          licenseId: licenseId,
          history: history,
        });
      }
      setShowHistoryModal(true);
    } catch (error) {
      console.error("Error fetching license history:", error);
    }
  };

  // Add these functions to handle button clicks
  const handleView = (rowData) => {
    // Implement view functionality
    toast.success(`Viewing data for message ID: ${rowData.message_id}`);
  };

  const filteredData = useMemo(() => {
    // Filtering the table data based on the search term
    if (!searchTerm) return tabData[activeTab]?.data || [];
    return tabData[activeTab]?.data?.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [tabData, activeTab, searchTerm]);

  const columns = useMemo(
    () =>
      tabData[activeTab]?.headers?.map((header) => {
        const key = header.toLowerCase().replace(/ /g, "_");
        return {
          Header: header,
          accessor: key === "sr._no." ? "sr_no" : key,
          sortType: (rowA, rowB, columnId) => {
            if (header === "Validity From" || header === "Validity Till") {
              const dateA = new Date(rowA.values[columnId]);
              const dateB = new Date(rowB.values[columnId]);
              return dateA.getTime() - dateB.getTime();
            }
            return rowA.values[columnId] > rowB.values[columnId] ? 1 : -1;
          },
          show: visibleColumns[key],
          Cell: ({ value, row }) => {
            if (header === "Issue") {
              const buttonText = !row.original.email ? "Allocate" : "Revoke";
              return (
                <button
                  className={`${
                    buttonText === "Revoke" ? "bg-red-500" : "bg-green-500"
                  } text-background w-16 py-1 rounded cursor-pointer transition-colors duration-300`}
                  onClick={() => handleIssueClick(row?.original, buttonText)}
                >
                  {buttonText}
                </button>
              );
            }
            if (header === "Print") {
              const buttonText = "Print";
              return (
                <button
                  className={`bg-green-500 text-background w-16 py-1 rounded cursor-pointer transition-colors duration-300`}
                  onClick={() => handliPrintHistory(row?.original?.license_id)}
                >
                  {buttonText}
                </button>
              );
            }
            if (
              header === "Validity From" ||
              header === "Validity Till" ||
              header === "STARTED ON" ||
              header === "COMPLETED ON" ||
              header === "RELEASE DATE" ||
              header === "QUARANTINED ON"
            ) {
              return <DateFormatter dateString={value} />;
            }
            if (header === "STATUS") {
              const getStatusColor = (status) => {
                switch (status?.toLowerCase()) {
                  case "completed":
                    return "bg-green-500";
                  case "processing":
                    return "bg-blue-500";
                  case "failed":
                    return "bg-red-500";
                  case "quarantined":
                    return "bg-red-500";
                  case "released":
                    return "bg-green-500";
                  case "under review":
                    return "bg-yellow-500";
                  case "pending":
                    return "bg-blue-500";
                  case "approved":
                    return "bg-emerald-500";
                  case "rejected":
                    return "bg-pink-500";
                  default:
                    return "bg-gray-500";
                }
              };

              return (
                <span
                  className={`px-2 py-1 rounded-md text-background capitalize ${getStatusColor(
                    value
                  )}`}
                >
                  {value}
                </span>
              );
            }

            if (header === "CHECK LEVEL") {
              const getCheckLevelColor = (level) => {
                switch (level?.toLowerCase()) {
                  case "high":
                    return "bg-red-500";
                  case "medium":
                    return "bg-yellow-500";
                  case "low":
                    return "bg-green-500";
                  default:
                    return "bg-gray-500";
                }
              };

              return (
                <span
                  className={`px-2 py-1 rounded-md text-background capitalize ${getCheckLevelColor(
                    value
                  )}`}
                >
                  {value}
                </span>
              );
            }
            if (header === "THREAT SCORE") {
              const getThreatScoreColor = (score) => {
                if (score >= 80) return "text-red-600 font-bold";
                if (score >= 60) return "text-orange-500 font-semibold";
                if (score >= 40) return "text-yellow-500";
                return "text-green-500";
              };
              return (
                <span className={getThreatScoreColor(value)}>{value}</span>
              );
            }
            if (header === "DETAILED REPORT") {
              return (
                <div className="">
                  <button
                    onClick={() => handleView(row.original)}
                    className="bg-primary hover:bg-secondary text-background font-semibold py-2 px-4 rounded-md inline-flex items-center text-xs"
                  >
                    <FaEye className="mr-2" />
                    <span>View</span>
                  </button>
                </div>
              );
            }
            return value;
          },
        };
      }),
    [activeTab, tabData, visibleColumns]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    nextPage,
    previousPage,
    canNextPage,
    canPreviousPage,
    pageOptions,
    gotoPage,
    state: { pageIndex },
    prepareRow,
  } = useTable(
    {
      columns,
      data: filteredData,
      initialState: {
        pageIndex: 0,
        sortBy: [
          {
            id: tabData[activeTab]?.headers[0]
              ?.toLowerCase()
              .replace(/ /g, "_"),
            desc: false,
          },
        ],
      },
    },
    useSortBy,
    usePagination
  );

  return (
    <div className="overflow-hidden flex flex-col gap-2">
      <div className="flex gap-2">
        {tabData?.map((tab, index) => (
          <button
            key={index}
            className={`
        flex-1 py-3 px-6 text-lg font-semibold rounded-lg
        ${
          activeTab === index
            ? "bg-background text-primary shadow-lg border border-primary "
            : "bg-primary text-background hover:bg-primary/50"
        }
      `}
            onClick={() => setActiveTab(index)}
          >
            {tab?.label}
          </button>
        ))}
      </div>
      {/* Search Input */}
      <div className="w-full mb-2 flex items-center justify-between gap-10 px-[2px]">
        <div className="relative max-w-sm">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-12 pr-10 text-gray-700 bg-background border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-300 ease-in-out"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              <Close className="h-5 w-5" />
            </button>
          )}
        </div>
        {/* <div className="">shorting button here</div> */}
        <div className="">
          <button
            className="bg-background text-primary px-4 py-2 rounded-lg shadow shadow-black/10 flex items-center gap-2"
            onClick={() => setShowColumnToggle(!showColumnToggle)}
          >
            <IoFilterSharp className="h-5 w-5" />
            Filter
          </button>
          {showColumnToggle && (
            <div className="absolute right-10 bg-background rounded-lg border shadow-lg mt-2 p-2 min-w-40">
              <h1 className="mb-2 border-b">Filter by</h1>
              {tabData[activeTab]?.headers?.map((header) => {
                const key = header.toLowerCase().replace(/ /g, "_");
                return (
                  <div key={key} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={key}
                      checked={visibleColumns[key]}
                      onChange={() => toggleColumnVisibility(header)}
                      className="mr-2"
                    />
                    <label htmlFor={key}>{header}</label>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-background rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto rounded-lg bg-background shadow-lg">
          {loading ? (
            <div className="flex justify-center items-center h-64 bg-background rounded-lg">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <p className="text-red-500 text-sm font-semibold p-5">{error}</p>
          ) : (
            <table
              {...getTableProps()}
              className="w-full text-sm text-left text-gray-500"
            >
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                {headerGroups?.map((headerGroup) => (
                  <tr {...headerGroup?.getHeaderGroupProps()}>
                    {headerGroup?.headers
                      ?.filter((column) => column.show)
                      ?.map((column) => (
                        <th
                          {...column.getHeaderProps(
                            column.getSortByToggleProps()
                          )}
                          className="px-6 py-3 text-center cursor-pointer"
                        >
                          {column.render("Header")}
                          <span>
                            {column.isSorted
                              ? column.isSortedDesc
                                ? " 🔽"
                                : " 🔼"
                              : ""}
                          </span>
                        </th>
                      ))}
                  </tr>
                ))}
              </thead>
              <tbody {...getTableBodyProps()}>
                {page?.map((row, rowIndex) => {
                  prepareRow(row);
                  return (
                    <tr
                      {...row?.getRowProps()}
                      key={row.id}
                      onClick={(event) =>
                        handleRowClick(event, row?.original?.license_id)
                      }
                      className={`bg-background border cursor-pointer ${
                        rowIndex % 2 === 0 ? "" : "bg-gray-50"
                      } hover:bg-gray-100`}
                    >
                      {row?.cells
                        ?.filter((cell) => cell.column.show)
                        ?.map((cell) => {
                          const { key, ...cellProps } = cell?.getCellProps();
                          return (
                            <td
                              key={key}
                              {...cellProps}
                              className="px-6 text-center py-2 whitespace-nowrap"
                            >
                              {cell?.render("Cell")}
                            </td>
                          );
                        })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between bg-gray-100 p-4 rounded-lg shadow-md">
          <div className="text-gray-700 font-semibold">
            Showing {pageIndex * 10 + 1}-
            {Math.min((pageIndex + 1) * 10, filteredData.length)} of{" "}
            {filteredData.length}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => previousPage()}
              disabled={!canPreviousPage}
              className={`p-2 rounded ${
                canPreviousPage
                  ? "bg-primary hover:bg-blue-600 text-background"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              } transition-colors duration-200 flex items-center`}
            >
              <FaChevronLeft />
            </button>
            {Array.from({ length: pageOptions.length }, (_, i) => i + 1).map(
              (pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => gotoPage(pageNumber - 1)}
                  className={`px-3 py-1 rounded ${
                    pageIndex === pageNumber - 1
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {pageNumber}
                </button>
              )
            )}
            <button
              onClick={() => nextPage()}
              disabled={!canNextPage}
              className={`p-2 rounded ${
                canNextPage
                  ? "bg-primary hover:bg-blue-600 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              } transition-colors duration-200 flex items-center`}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
      {showLicensePopup && (
        <LicenseForm
          onClose={() => setShowLicensePopup(false)}
          rowData={selectedRow}
          handleSubmit={handleSubmit}
          handleRevoke={handleRevoke}
        />
      )}
      {showHistoryModal && (
        <LicenseHistoryModal
          licenseId={selectedLicenseHistory.licenseId}
          history={selectedLicenseHistory.history}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  );
};

export default Table;
