import React, { useState, useEffect } from "react";
import Table from "../components/Tables/Table";
import { fetchRunTestData, fetchFetchData } from "../Api/api";
import { toast } from "react-toastify";
import { SandBoxData } from "../mockData";

function SandBox() {
  const [runTestData, setRunTestData] = useState([]);
  const [fetchData, setFetchData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        const runTestResponse = await fetchRunTestData();
        const fetchDataResponse = await fetchFetchData();

        const runTestResult = await runTestResponse.json();
        const fetchDataResult = await fetchDataResponse.json();

        if (runTestResult.length > 0) {
          setRunTestData(runTestResult);
          toast.success("Run Test data loaded successfully");
        } else {
          setRunTestData(SandBoxData[0]);
          toast.info("No Run Test data available. Showing dummy data.");
        }

        if (fetchDataResult.length > 0) {
          setFetchData(fetchDataResult);
          toast.success("Fetch Data loaded successfully");
        } else {
          setFetchData(SandBoxData[1]);
          toast.info("No Fetch Data available. Showing dummy data.");
        }
      } catch (error) {
        console.error("Error fetching sandbox data:", error);
        setRunTestData(SandBoxData[0]);
        setFetchData(SandBoxData[1]);
        toast.error("Failed to fetch data. Showing dummy data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const combinedData = [runTestData, fetchData];

  return (
    <div className="w-full flex flex-col gap-5">
      <h1 className="text-3xl font-semibold">Sand Box</h1>
      <div className="">
        {isLoading ? (
          <div className="flex justify-center items-center h-64 bg-background rounded-lg">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Table tabData={combinedData} />
        )}
      </div>
    </div>
  );
}

export default SandBox;
