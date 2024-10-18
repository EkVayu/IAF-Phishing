import React, { useState, useEffect } from "react";
import Table from "../components/Tables/Table";
import { fetchRunTestData, fetchFetchData } from "../Api/api";
import { toast } from "react-toastify";
import { generateSandBoxData } from "../Utils/generateSandBoxData";

function SandBox() {
  const [sandBoxData, setSandBoxData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const runTestResponse = await fetchRunTestData();
        const fetchDataResponse = await fetchFetchData();

        if (runTestResponse.ok && fetchDataResponse.ok) {
          const runTestResult = await runTestResponse.json();
          const fetchDataResult = await fetchDataResponse.json();
          setSandBoxData([
            { ...runTestResult[0], label: "Run Test" },
            { ...fetchDataResult[0], label: "Fetch Data" },
          ]);
        } else {
          setError("No data available!");
          toast.error("No data available!");
          setSandBoxData([]);
        }
      } catch (err) {
        console.error("Error fetching sandbox data:", err);
        const generatedData = generateSandBoxData(5);
        setSandBoxData(generatedData);
        toast.error(`API error: ${err.message}`);
        // setError(`API error: ${err.message}`);
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
        ) : Array.isArray(sandBoxData) && sandBoxData.length > 0 ? (
          <Table tabData={sandBoxData} error={error} />
        ) : null}
      </div>
    </div>
  );
}

export default SandBox;
