import React, { useState, useEffect } from "react";
import Table from "../components/Tables/Table";
import {
  fetchStatusData,
  fetchCheckLevelData,
  fetchImportTestData,
} from "../Api/api";
import { toast } from "react-toastify";

function Quarantine() {
  const [quarantineData, setQuarantineData] = useState([
    {
      label: "Status",
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
      label: "Check Level",
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
      label: "Import Test Data",
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
        const [statusResponse, checkLevelResponse, importTestResponse] =
          await Promise.all([
            fetchStatusData(),
            fetchCheckLevelData(),
            fetchImportTestData(),
          ]);

        if (
          !statusResponse.ok ||
          !checkLevelResponse.ok ||
          !importTestResponse.ok
        ) {
          throw new Error("Failed to fetch data from one or more endpoints");
        }

        const statusResult = await statusResponse.json();
        const checkLevelResult = await checkLevelResponse.json();
        const importTestResult = await importTestResponse.json();

        setQuarantineData([
          {
            label: "Status",
            headers: [
              "Message ID",
              "Created At",
              "AI Sent At",
              "AI Status",
              "Attachments",
            ],
            data: statusResult,
          },
          {
            label: "Check Level",
            headers: [
              "Message ID",
              "Created At",
              "AI Sent At",
              "AI Status",
              "Attachments",
            ],
            data: checkLevelResult,
          },
          {
            label: "Import Test Data",
            headers: [
              "Message ID",
              "Created At",
              "AI Sent At",
              "AI Status",
              "Attachments",
            ],
            data: importTestResult,
          },
        ]);
      } catch (err) {
        console.error("Error fetching quarantine data:", err);
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
        Quarantine
      </h1>
      <div className="">
        <Table
          tabData={quarantineData}
          error={error}
          loading={loading}
          setLoading={setLoading}
          setError={setError}
        />
      </div>
    </div>
  );
}

export default Quarantine;
