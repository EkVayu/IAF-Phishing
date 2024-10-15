import React, { useState, useEffect } from "react";
import {
  FaTrash,
  FaEdit,
  FaPlus,
  FaSearch,
  FaTimes,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { fetchLicenses } from "../../Api/api";
import CreateLicense from "../../components/popup/CreateLicense/CreateLicense";
import mockData from "../../mockData";
import DateFormatter from "../../components/Common/DateFormatter";

function Licenses() {
  const [licenses, setLicenses] = useState([]);
  // const [licenses, setLicenses] = useState(mockData);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState(null); // For tracking errors

  const getLicenses = async () => {
    try {
      const response = await fetchLicenses();
      if (!response.ok) {
        toast.error("Error fetching data:", error);
      }
      const data = await response.json();
      setLicenses(data);
      setLoading(false); // Stop loading on successful fetch
    } catch (error) {
      console.error("Error fetching licenses:", error);
      setLoading(false); // Stop loading on error
      setError("Failed to load license data. Please try again.");
      toast.error("Failed to fetch licenses");
    }
  };

  useEffect(() => {
    getLicenses();
  }, []);

  const handleStatusChange = (id, currentStatus) => {
    const newStatus = currentStatus === "1" ? "0" : "1";
    // Implement API call to update status here
    toast.success(
      `License status changed to ${
        newStatus === "1" ? "Active" : "Inactive"
      } for id: ${id}`
    );
    // Update the licenses state with the new status
    setLicenses(
      licenses.map((license) =>
        license.license_id === id ? { ...license, status: newStatus } : license
      )
    );
  };

  const filteredLicenses = licenses?.filter((license) => {
    const searchFields = [
      license.license_id,
      license.plugin_id,
      license.allocated_to,
      license.valid_from,
      license.valid_till,
    ];

    return searchFields.some((field) =>
      field?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <>
      <div className="w-full">
        <h1 className="text-3xl font-bold mb-6 text-primary">
          License Management
        </h1>
        <div className="bg-background shadow-lg rounded-lg overflow-hidden">
          <div className="p-4 flex justify-between items-center bg-indigo-100">
            <h2 className="text-xl font-semibold text-primary">
              Licenses List
            </h2>
            <div className="flex items-center">
              <div className="relative max-w-sm mr-4">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 pl-12 pr-10 text-gray-700 bg-background border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-300 ease-in-out"
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
              <button
                onClick={() => setShowForm(true)}
                className="bg-primary text-background px-4 py-2 rounded-full hover:bg-secondary transition duration-300 flex items-center"
              >
                <FaPlus className="mr-2" />
                Add License
              </button>
            </div>
          </div>
          <table className="w-full">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <p className="text-red-500 text-sm font-semibold p-5">{error}</p>
            ) : (
              <div className="w-full">
                <thead>
                  <tr className="bg-indigo-200 text-primary">
                    <th className="py-3 px-4 text-left">License ID</th>
                    <th className="py-3 px-4 text-left">Plugin ID</th>
                    <th className="py-3 px-4 text-left">Email</th>
                    <th className="py-3 px-4 text-left">Validity From</th>
                    <th className="py-3 px-4 text-center">Validity Till</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLicenses?.map((license) => (
                    <tr
                      key={license.id}
                      className="border-b border-indigo-100 hover:bg-indigo-50 transition duration-200"
                    >
                      <td className="py-3 px-4">{license.license_id}</td>
                      <td className="py-3 px-4">{license.plugin_id}</td>
                      <td className="py-3 px-4">{license.allocated_to}</td>
                      <td className="py-3 px-4">
                        <DateFormatter dateString={license.valid_from} />
                      </td>
                      <td className="py-3 px-4">
                        <DateFormatter dateString={license.valid_till} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            license.status === "1"
                              ? "bg-green-200 text-green-800"
                              : "bg-red-200 text-red-800"
                          }`}
                        >
                          {license.status === "1" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() =>
                            handleStatusChange(
                              license.license_id,
                              license.status
                            )
                          }
                          className={`mr-2 p-1 rounded ${
                            license.status === "1"
                              ? "text-green-600 hover:text-green-800"
                              : "text-red-600 hover:text-red-800"
                          }`}
                          title={`Toggle ${
                            license.status === "1" ? "Inactive" : "Active"
                          }`}
                        >
                          {license.status === "1" ? (
                            <FaToggleOn size={30} />
                          ) : (
                            <FaToggleOff size={30} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </div>
            )}
          </table>
        </div>
      </div>

      {showForm && (
        <CreateLicense setShowForm={setShowForm} getLicenses={getLicenses} />
      )}
    </>
  );
}

export default Licenses;
