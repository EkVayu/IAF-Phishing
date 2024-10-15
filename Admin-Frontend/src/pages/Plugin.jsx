import React, { useEffect, useState } from "react";
import Table from "../components/Tables/Table";
import { fetchLicenses } from "../Api/api";
import { toast } from "react-toastify";
import generateDummyLicenses from "../Utils/LecenseGenerator";

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
      if (result && result.length > 0) {
        setLicenseData(result);
        toast.success("Displaying live data from API");
      } else {
        const dummyData = generateDummyLicenses(10); // Generate 10 dummy licenses
        setLicenseData(dummyData);
        toast.info("No live data available. Displaying generated dummy data");
      }
    } catch (error) {
      console.error("Failed to load license data:", error);
      const dummyData = generateDummyLicenses(10); // Generate 10 dummy licenses
      setLicenseData(dummyData);
      toast.warning("API error. Displaying generated dummy data");
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
      data: licenseData
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
      data: licenseData
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
      data: licenseData
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
      data: licenseData?.map((item) => ({
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
      <h1 className="text-3xl font-semibold text-secondary-foreground">
        Plugin Management
      </h1>
      <div className="">
        <Table
          tabData={tabData}
          loading={loading}
          setLoading={setLoading}
          error={error}
          fetchLicensesData={fetchLicensesData}
        />
      </div>
    </div>
  );
}

export default Plugin;
