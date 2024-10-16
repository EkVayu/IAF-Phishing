import React, { useState, useEffect } from "react";
import { FaPlus, FaToggleOn, FaToggleOff } from "react-icons/fa";
import { toast } from "react-toastify";
import { fetchLicenses } from "../../Api/api";
import CreateLicense from "../../components/popup/CreateLicense/CreateLicense";
import Table3 from "../../components/Tables/Table3";
import generateDummyLicenses from "../../Utils/LecenseGenerator";

function Licenses() {
  const [licenses, setLicenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const columns = [
    { Header: "License ID", accessor: "license_id" },
    { Header: "Plugin ID", accessor: "plugin_id" },
    { Header: "Email", accessor: "allocated_to" },
    { Header: "Validity From", accessor: "valid_from" },
    { Header: "Validity Till", accessor: "valid_till" },
    { Header: "Status", accessor: "statusText" },
    {
      Header: "Actions",
      accessor: "actions",
      cell: (row, onAction) => (
        <button
          onClick={() => onAction(row.license_id, "toggle")}
          className={`mr-2 p-1 rounded ${
            row.status === "1"
              ? "text-green-600 hover:text-green-800"
              : "text-red-600 hover:text-red-800"
          }`}
          title={`Toggle ${row.status === "1" ? "Inactive" : "Active"}`}
        >
          {row.status === "1" ? (
            <FaToggleOn size={30} />
          ) : (
            <FaToggleOff size={30} />
          )}
        </button>
      ),
    },
  ];

  const processLicenses = (licenses) => {
    return licenses.map((license) => ({
      ...license,
      plugin_id: license.plugins[0]?.plugin_id || "N/A",
      allocated_to: license.allocated_to || "N/A",
      statusText: license.status === "1" ? "Active" : "Inactive",
    }));
  };

  const getLicenses = async () => {
    try {
      const response = await fetchLicenses();
      if (response.ok) {
        const data = await response.json();
        setLicenses(processLicenses(data));
        setLoading(false);
      } else {
        setError("Server response not Ok!");
        setLoading(false);
        toast.warning("Server response not OK!.");
      }
    } catch (error) {
      console.error("Error fetching licenses:", error);
      const dummyLicenses = generateDummyLicenses(5);
      setLicenses(processLicenses(dummyLicenses));
      setLoading(false);
      toast.error(`API error: ${error.message}`);
      setError(`API error: ${error.message}`);
    }
  };

  useEffect(() => {
    getLicenses();
  }, []);

  const handleAction = (id, action) => {
    if (action === "toggle") {
      setLicenses((prevLicenses) =>
        prevLicenses.map((license) => {
          if (license.license_id === id) {
            const newStatus = license.status === "1" ? "0" : "1";
            return {
              ...license,
              status: newStatus,
              statusText: newStatus === "1" ? "Active" : "Inactive",
            };
          }
          return license;
        })
      );
      toast.success(`License status changed for id: ${id}`);
    }
  };

  return (
    <>
      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">
            License Management
          </h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-white px-4 py-2 rounded-full hover:bg-secondary transition duration-300 flex items-center"
          >
            <FaPlus className="mr-2" />
            Add License
          </button>
        </div>
        <Table3
          data={licenses}
          columns={columns}
          onAction={handleAction}
          loading={loading}
          error={error}
        />
      </div>
      {showForm && (
        <CreateLicense setShowForm={setShowForm} getLicenses={getLicenses} />
      )}
    </>
  );
}

export default Licenses;
