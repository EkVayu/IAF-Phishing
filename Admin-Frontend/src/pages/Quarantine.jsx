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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
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
          toast.success("Quarantine data loaded successfully");
        } else {
          const generatedData = generateQuarantineData();
          setQuarantineData(generatedData);
          toast.info("No Quarantine data available. Showing dummy data.");
        }
      } catch (error) {
        console.error("Error fetching quarantine data:", error);
        const generatedData = generateQuarantineData();
        setQuarantineData(generatedData);
        toast.error("Failed to fetch data. Showing dummy data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  return (
    <div className="w-full flex flex-col gap-5">
      <h1 className="text-3xl font-semibold text-secondary-foreground">
        Quarantine
      </h1>
      <div className="">
        {isLoading ? (
          <div className="flex justify-center items-center h-64 bg-background rounded-lg">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary dark:border-white"></div>
          </div>
        ) : (
          <Table tabData={quarantineData} />
        )}
      </div>
    </div>
  );
}

export default Quarantine;
