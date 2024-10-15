import React, { useEffect, useState } from "react";
import Table from "../components/Tables/Table";
import mockData from "../mockData";
import { fetchLicenses } from "../Api/api";
import { toast } from "react-toastify";

function Plugin() {
  const [licenseData, setLicenseData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLicensesData = async () => {
    try {
      const response = await fetchLicenses();
      if (!response.ok) {
        throw new Error("Error fetching data");
      }
      const result = await response.json();
      console.log("API Response:", result);
      if (result && result.length > 0) {
        setLicenseData(result);
        toast.success("Displaying live data from API");
      } else {
        setLicenseData(mockData);
        toast.info("No live data available. Displaying dummy data");
      }
    } catch (error) {
      console.error("Failed to load license data:", error);
      setLicenseData(mockData);
      toast.warning("API error. Displaying dummy data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicensesData();
  }, []);

  const tabData = [
    {
      label: "Available License",
      headers: [
        "License ID",
        "Plugin ID",
        "Email",
        "Validity From",
        "Validity Till",
        "Issue",
      ],
      data: (licenseData.length > 0 ? licenseData : mockData)
        ?.filter(
          (item) =>
            !item.allocated_to && (!item.plugins || item.plugins.length === 0)
        )
        ?.map((item) => ({
          license_id: item?.license_id,
          plugin_id: item?.plugins[0]?.plugin_id,
          email: item?.allocated_to,
          validity_from: item?.valid_from,
          validity_till: item?.valid_till,
          issue: item?.status,
        })),
    },
    {
      label: "Allocated License",
      headers: [
        "License ID",
        "Plugin ID",
        "Email",
        "Validity From",
        "Validity Till",
        "Issue",
      ],
      data: (licenseData.length > 0 ? licenseData : mockData)
        ?.filter(
          (item) =>
            item.allocated_to &&
            item.plugins &&
            item.plugins.length > 0 &&
            item.plugins[0].plugin_id
        )
        ?.map((item) => ({
          license_id: item?.license_id,
          plugin_id: item?.plugins[0]?.plugin_id,
          email: item?.allocated_to,
          validity_from: item?.valid_from,
          validity_till: item?.valid_till,
          issue: item?.status,
        })),
    },
    {
      label: "Uninstall License",
      headers: [
        "License ID",
        "Plugin ID",
        "Email",
        "Validity From",
        "Validity Till",
        "Issue",
      ],
      data: (licenseData.length > 0 ? licenseData : mockData)
        ?.filter(
          (item) =>
            item.allocated_to && (!item.plugins || item.plugins.length === 0)
        )
        ?.map((item) => ({
          license_id: item?.license_id,
          plugin_id: item?.plugins[0]?.plugin_id,
          email: item?.allocated_to,
          validity_from: item?.valid_from,
          validity_till: item?.valid_till,
          issue: item?.status,
        })),
    },
    {
      label: "License Report",
      headers: [
        "License ID",
        "Plugin ID",
        "Email",
        "Validity From",
        "Validity Till",
        "Print",
      ],
      data: (licenseData.length > 0 ? licenseData : mockData)?.map((item) => ({
        license_id: item?.license_id,
        plugin_id: item?.plugins[0]?.plugin_id,
        email: item?.allocated_to,
        validity_from: item?.valid_from,
        validity_till: item?.valid_till,
        issue: item?.status,
      })),
    },
  ];

  return (
    <div className="w-full flex flex-col gap-5">
      <h1 className="text-3xl font-semibold">Plugin Management</h1>
      <div className="">
        <Table
          tabData={tabData}
          loading={loading}
          error={error}
          fetchLicensesData={fetchLicensesData}
        />
      </div>
    </div>
  );
}

export default Plugin;
