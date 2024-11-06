import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Search, X as Close } from "lucide-react";
import { IoAddCircle, IoFilterSharp } from "react-icons/io5";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import CreateRogueDBModal from "../components/popup/RogueDB/CreateRogueDBModal";
import DeleteConfirmModal from "../components/popup/RogueDB/DeleteConfirmModal";
import EditRogueDBModal from "../components/popup/RogueDB/EditRogueDBModal";
import {
  createRoughDomain,
  createRoughMail,
  createRoughUrl,
  deleteRoughDomain,
  deleteRoughMail,
  deleteRoughUrl,
  fetchRoughDomain,
  fetchRoughMail,
  fetchRoughUrl,
  updateRoughDomain,
  updateRoughMail,
  updateRoughUrl,
} from "../Api/api";

const dummyUrlData = [
  { id: 1, url: "https://example.com", protocol: "HTTPS" },
  { id: 2, url: "http://dummy.com", protocol: "HTTP" },
];

const dummyDomainData = [
  { id: 1, ip: "192.168.1.1", prototype: "IPv4" },
  { id: 2, ip: "2001:db8::1", prototype: "IPv6" },
];

const dummyMailData = [
  { id: 1, mailid: "user1@example.com" },
  { id: 2, mailid: "user2@dummy.com" },
];

function RogueDB() {
  const [urlData, setUrlData] = useState([]);
  const [domainData, setDomainData] = useState([]);
  const [mailData, setMailData] = useState([]);
  const [activeTab, setActiveTab] = useState("url");
  const [searchTerm, setSearchTerm] = useState("");
  const [showColumnToggle, setShowColumnToggle] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [error, setError] = useState(null);

  const pageSize = 10;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    initializeVisibleColumns();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const urlResponse = await fetchRoughUrl();
      const domainResponse = await fetchRoughDomain();
      const mailResponse = await fetchRoughMail();

      if (urlResponse.ok && domainResponse.ok && mailResponse.ok) {
        const urlData = await urlResponse.json();
        const domainData = await domainResponse.json();
        const mailData = await mailResponse.json();

        setUrlData(urlData.results.data);
        setDomainData(domainData.results.data);
        setMailData(mailData.results.data);
        setLoading(false);
      } else {
        setLoading(false);
        setError("API response not OK.");
        toast.warn("API response not OK.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
      setUrlData(dummyUrlData);
      setDomainData(dummyDomainData);
      setMailData(dummyMailData);
      toast.error(`API error: ${error.message}`);
      // setError(`API error: ${error.message}`);
    }
  };

  const initializeVisibleColumns = () => {
    const columns = {};
    tabData[activeTab].headers.forEach((header) => {
      columns[header.toLowerCase().replace(/ /g, "_")] = true;
    });
    setVisibleColumns(columns);
  };

  const handleCreate = (newItem) => {
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const newItem = Object.fromEntries(formData.entries());

    try {
      let response;
      if (activeTab === "url") {
        response = await createRoughUrl(newItem);
      } else if (activeTab === "domain") {
        response = await createRoughDomain(newItem);
      } else if (activeTab === "mail") {
        response = await createRoughMail(newItem);
      }

      if (response && response.message) {
        toast.success(response.message);
        setIsModalOpen(false);
        fetchData();
      } else {
        toast.error("Failed to create item");
      }
    } catch (error) {
      console.error("Error creating item:", error);
      toast.error("Error creating item");
    }
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const updatedItem = Object.fromEntries(formData.entries());
    try {
      let response;
      if (activeTab === "url") {
        response = await updateRoughUrl(selectedItem.id, updatedItem);
      } else if (activeTab === "domain") {
        response = await updateRoughDomain(selectedItem.id, updatedItem);
      } else if (activeTab === "mail") {
        response = await updateRoughMail(selectedItem.id, updatedItem);
      }

      if (response && response.message) {
        toast.success(response.message);
        setIsEditModalOpen(false);
        fetchData();
      } else {
        toast.error("Failed to update item");
      }
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Error updating item");
    }
  };

  const handleDeleteClick = (item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let response;
      if (activeTab === "url") {
        response = await deleteRoughUrl(selectedItem.id);
      } else if (activeTab === "domain") {
        response = await deleteRoughDomain(selectedItem.id);
      } else if (activeTab === "mail") {
        response = await deleteRoughMail(selectedItem.id);
      }

      if (response && response.ok) {
        toast.success("Item deleted successfully");
        setLoading(false);
        setIsDeleteModalOpen(false);
        fetchData();
      } else {
        toast.error("Failed to delete item");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(`Error deleting item: ${error.message}`);
      setLoading(false);
    }
  };

  const toggleColumnVisibility = (header) => {
    const key = header.toLowerCase().replace(/ /g, "_");
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const tabData = {
    url: {
      headers: ["ID", "URL", "Protocol"],
      dataKeys: ["id", "url", "protocol"],
    },
    domain: {
      headers: ["ID", "IP", "Prototype"],
      dataKeys: ["id", "ip", "prototype"],
    },
    mail: {
      headers: ["ID", "Mail ID"],
      dataKeys: ["id", "mailid"],
    },
  };

  const filteredData = () => {
    let data;
    switch (activeTab) {
      case "url":
        data = urlData;
        break;
      case "domain":
        data = domainData;
        break;
      case "mail":
        data = mailData;
        break;
      default:
        data = [];
    }

    return data.filter((item) =>
      Object.values(item).some((value) =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const paginatedData = () => {
    const filtered = filteredData();
    const startIndex = (currentPage - 1) * pageSize;
    return filtered.slice(startIndex, startIndex + pageSize);
  };

  const pageCount = Math.ceil(filteredData().length / pageSize);
  const canPreviousPage = currentPage > 1;
  const canNextPage = currentPage < pageCount;

  const previousPage = () => {
    if (canPreviousPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  const nextPage = () => {
    if (canNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const gotoPage = (page) => {
    const pageNumber = Math.max(1, Math.min(page, pageCount));
    setCurrentPage(pageNumber);
  };

  return (
    <div className="w-full flex flex-col">
      <h1 className="text-3xl font-semibold text-secondary-foreground tracking-widest">
        Rogue DB
      </h1>
      <div className="flex gap-4 mt-5">
        {Object.keys(tabData).map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-3 px-6 text-lg font-semibold rounded-lg ${
              activeTab === tab
                ? "bg-background text-primary dark:text-white shadow-md border border-primary dark:border-gray-800"
                : "bg-primary dark:bg-gray-800 text-background dark:text-white hover:bg-primary/50"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}s
          </button>
        ))}
      </div>
      <div className="flex justify-between items-center mt-5">
        <div className="relative max-w-sm">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-12 pr-10 text-secondary-foreground bg-background border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-300 ease-in-out"
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
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2"
            onClick={handleCreate}
          >
            <IoAddCircle className="h-5 w-5" />
            Add{" "}
            {activeTab === "url"
              ? "URL"
              : activeTab === "domain"
              ? "Domain"
              : "Mail"}
          </button>

          <div className="">
            <button
              className="bg-background text-primary dark:text-white px-4 py-2 rounded-lg shadow shadow-black/10 dark:shadow-white flex items-center gap-2"
              onClick={() => setShowColumnToggle(!showColumnToggle)}
            >
              <IoFilterSharp className="h-5 w-5" />
              Filter
            </button>
            {showColumnToggle && (
              <div className="absolute right-10 bg-background rounded-lg border shadow-lg mt-2 p-2 min-w-40">
                <h1 className="mb-2 border-b text-secondary-foreground">
                  Filter by
                </h1>
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
                      <label
                        htmlFor={key}
                        className="text-secondary-foreground"
                      >
                        {header}
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 bg-background dark:bg-gray-800 rounded-lg mt-5">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary dark:border-white"></div>
        </div>
      ) : error ? (
        <div className="w-full py-5 px-3 bg-background dark:bg-gray-800 rounded-lg mt-5">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <div className="rounded-t-lg overflow-hidden mt-5">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-primary dark:bg-gray-800 text-white uppercase">
                {tabData[activeTab].headers.map(
                  (header, index) =>
                    visibleColumns[header.toLowerCase().replace(/ /g, "_")] && (
                      <th key={index} className="py-2 px-4 text-center">
                        {header}
                      </th>
                    )
                )}
                <th className="py-2 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData().map((item) => (
                <tr
                  key={item.id}
                  className="border bg-background hover:bg-gray-200 dark:hover:bg-gray-900"
                >
                  {tabData[activeTab].dataKeys.map(
                    (key, index) =>
                      visibleColumns[
                        tabData[activeTab].headers[index]
                          .toLowerCase()
                          .replace(/ /g, "_")
                      ] && (
                        <td
                          key={key}
                          className="py-2 px-4 text-center text-secondary-foreground"
                        >
                          {item[key]}
                        </td>
                      )
                  )}
                  <td className="py-2 px-4 text-right text-xs">
                    <button
                      className="bg-blue-500 text-white px-2 py-1 rounded mr-2"
                      onClick={() => handleEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded"
                      onClick={() => handleDeleteClick(item)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && (
        <div className="flex items-center justify-between p-2 rounded-b-lg bg-background dark:bg-gray-800">
          <div className="text-secondary-foreground font-semibold">
            Showing {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, filteredData().length)} of{" "}
            {filteredData().length}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={previousPage}
              disabled={!canPreviousPage}
              className={`p-2 rounded ${
                canPreviousPage
                  ? "bg-primary hover:bg-secondary text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              } transition-colors duration-200 flex items-center`}
            >
              <FaChevronLeft />
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map(
              (pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => gotoPage(pageNumber)}
                  className={`px-3 py-1 rounded ${
                    currentPage === pageNumber
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {pageNumber}
                </button>
              )
            )}
            <button
              onClick={nextPage}
              disabled={!canNextPage}
              className={`p-2 rounded ${
                canNextPage
                  ? "bg-primary hover:bg-secondary text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              } transition-colors duration-200 flex items-center`}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}
      <CreateRogueDBModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeTab={activeTab}
        onSubmit={handleModalSubmit}
        loading={loading}
      />
      <EditRogueDBModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        item={selectedItem}
        activeTab={activeTab}
        loading={loading}
      />
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemType={activeTab}
        item={selectedItem}
        loading={loading}
      />
    </div>
  );
}

export default RogueDB;
