import React, { useState, useEffect } from "react";
import Table from "../components/Tables/Table";
import { fetchRunTestData, fetchSandboxFetchedData } from "../Api/api";
import { toast } from "react-toastify";

function SandBox() {
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
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [runTestResponse, fetchFetchedResponse] = await Promise.all([
          fetchRunTestData(),
          fetchSandboxFetchedData(),
        ]);

        if (!runTestResponse.ok || !fetchFetchedResponse.ok) {
          throw new Error("Failed to fetch data from one or more endpoints");
        }

        const runTestResult = await runTestResponse.json();
        const fetchDataResult = await fetchFetchedResponse.json();

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
            data: runTestResult,
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
            data: fetchDataResult,
          },
        ]);
      } catch (err) {
        console.error("Error fetching sandbox data:", err);
        setError(`Failed to load data: ${err.message}`);
        toast.error(`Failed to load data: ${err.message}`);
      } finally {
        setLoading(false);
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
