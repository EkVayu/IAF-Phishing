import React, { useState, useEffect } from "react";
import Table from "../components/Tables/Table";
import {
  fetchStatusData,
  fetchCheckLevelData,
  fetchImportTestData,
} from "../Api/api";
import { toast } from "react-toastify";
import { generateQuarantineData } from "../Utils/QuarantineDataGenerator";

function Quarantine() {
  const [quarantineData, setQuarantineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        const [statusResponse, checkLevelResponse, importTestResponse] =
          await Promise.all([
            fetchStatusData(),
            fetchCheckLevelData(),
            fetchImportTestData(),
          ]);

        const [statusResult, checkLevelResult, importTestResult] =
          await Promise.all([
            statusResponse.json(),
            checkLevelResponse.json(),
            importTestResponse.json(),
          ]);

        if (
          statusResult.length &&
          checkLevelResult.length &&
          importTestResult.length
        ) {
          const formattedData = [
            { ...statusResult[0], label: "Status" },
            { ...checkLevelResult[0], label: "Check Level" },
            { ...importTestResult[0], label: "Import Test Data" },
          ];
          setQuarantineData(formattedData);
        } else {
          setError("No data available");
        }
      } catch (err) {
        console.error("Error fetching quarantine data:", err);
        // const data = generateQuarantineData(5);
        // setQuarantineData(data);
        toast.error(`Error: ${err.message}`);
        setError(`Error: ${err.message}`);
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
        {loading ? (
          <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-lg">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary dark:border-white"></div>
          </div>
        ) : quarantineData && quarantineData.length > 0 ? (
          <Table tabData={quarantineData} error={error} loading={loading} />
        ) : (
          <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-red-500">No data available</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Quarantine;
