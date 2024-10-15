import React, { useState, useEffect } from "react";
import Table from "../components/Tables/Table";
import { fetchRunTestData, fetchFetchData } from "../Api/api";
import { toast } from "react-toastify";
import { generateSandBoxData } from "../Utils/generateSandBoxData";

function SandBox() {
  const [sandBoxData, setSandBoxData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        const runTestResponse = await fetchRunTestData();
        const fetchDataResponse = await fetchFetchData();

        const runTestResult = await runTestResponse.json();
        const fetchDataResult = await fetchDataResponse.json();

        if (runTestResult.length > 0 && fetchDataResult.length > 0) {
          setSandBoxData([
            { ...runTestResult[0], label: "Run Test" },
            { ...fetchDataResult[0], label: "Fetch Data" },
          ]);
          toast.success("SandBox data loaded successfully");
        } else {
          const generatedData = generateSandBoxData();
          setSandBoxData(generatedData);
          toast.info("No SandBox data available. Showing dummy data.");
        }
      } catch (error) {
        console.error("Error fetching sandbox data:", error);
        const generatedData = generateSandBoxData();
        setSandBoxData(generatedData);
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
        Sand Box
      </h1>
      <div className="">
        {isLoading ? (
          <div className="flex justify-center items-center h-64 bg-background rounded-lg">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary dark:border-white"></div>
          </div>
        ) : (
          <Table tabData={sandBoxData} />
        )}
      </div>
    </div>
  );
}

export default SandBox;
