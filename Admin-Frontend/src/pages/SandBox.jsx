import React, { useState, useEffect } from "react";
import Table from "../components/Tables/Table";
import { fetchRunTestData, fetchSandboxFetchedData } from "../Api/api";
import { toast } from "react-toastify";

function SandBox() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sandBoxData, setSandBoxData] = useState([
    {
      label: "Run Test",
      headers: [
        "Message ID",
        "Created At",
        "AI Sent At",
        "AI Status",
        "Attachments",
      ],
      data: [],
      error: null,
      loading: false,
    },
    {
      label: "Fetch Data",
      headers: [
        "Message ID",
        "Created At",
        "AI Sent At",
        "AI Status",
        "Attachments",
      ],
      data: [],
      error: null,
      loading: false,
    },
  ]);

  useEffect(() => {
    const fetchAllData = async () => {
      // Set loading state individually for each tab
      setSandBoxData((prev) => prev.map((tab) => ({ ...tab, loading: true })));

      try {
        // Fetch Run Test data
        const runTestResponse = await fetchRunTestData();
        const runTestResult = runTestResponse.ok
          ? await runTestResponse.json()
          : null;

        if (!runTestResponse.ok) {
          toast.error("Failed to fetch Run Test data");
        }

        // Fetch Sandbox data
        const fetchDataResponse = await fetchSandboxFetchedData();
        const fetchDataResult = fetchDataResponse.ok
          ? await fetchDataResponse.json()
          : null;

        if (!fetchDataResponse.ok) {
          toast.error("Failed to fetch Sandbox data");
        }

        // If both requests succeed, show success toast
        if (runTestResponse.ok && fetchDataResponse.ok) {
          toast.success("Data fetched successfully!");
        }

        setSandBoxData([
          {
            label: "Run Test",
            headers: [
              "Message ID",
              "Created At",
              "AI Sent At",
              "AI Status",
              "Attachments",
            ],
            data: runTestResult || [],
            error: !runTestResponse.ok ? "Failed to fetch Run Test data" : null,
            loading: false,
          },
          {
            label: "Fetch Data",
            headers: [
              "Message ID",
              "Created At",
              "AI Sent At",
              "AI Status",
              "Attachments",
            ],
            data: fetchDataResult || [],
            error: !fetchDataResponse.ok
              ? "Failed to fetch Sandbox data"
              : null,
            loading: false,
          },
        ]);
      } catch (err) {
        console.error("Error fetching sandbox data:", err);
        setSandBoxData((prev) =>
          prev.map((tab) => ({
            ...tab,
            error: `Failed to load data: ${err.message}`,
            loading: false,
          }))
        );
        toast.error(`Failed to load data: ${err.message}`);
      }
    };

    fetchAllData();
  }, []);

  return (
    <div className="w-full flex flex-col gap-5">
      <h1 className="text-3xl font-semibold text-secondary-foreground tracking-widest">
        Sand Box
      </h1>
      <div className="">
        <Table
          tabData={sandBoxData}
          error={error}
          loading={loading}
          setLoading={setLoading}
          setError={setError}
        />
      </div>
    </div>
  );
}

export default SandBox;
