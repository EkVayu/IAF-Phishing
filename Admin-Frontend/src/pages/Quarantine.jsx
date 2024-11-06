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
        const statusResponse = await fetchStatusData();
        const checkLevelResponse = await fetchCheckLevelData();
        const importTestResponse = await fetchImportTestData();

        const statusResult = await statusResponse.json();
        const checkLevelResult = await checkLevelResponse.json();
        const importTestResult = await importTestResponse.json();

        if (
          statusResult.length > 0 &&
          checkLevelResult.length > 0 &&
          importTestResult.length > 0
        ) {
          setQuarantineData([
            { ...statusResult[0], label: "Status" },
            { ...checkLevelResult[0], label: "Check Level" },
            { ...importTestResult[0], label: "Import Test Data" },
          ]);
          setLoading(false);
        } else {
          setError("No data available!");
          toast.error("No data available!");
        }
      } catch (err) {
        console.error("Error fetching quarantine data:", err);
        const generatedData = generateQuarantineData();
        setQuarantineData(generatedData);
        toast.error(`API error: ${err.message}`);
        // setError(`API error: ${err.message}`);
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
        ) : (
          <Table tabData={quarantineData} error={error} loading={loading} />
        )}
      </div>
    </div>
  );
}

export default Quarantine;
