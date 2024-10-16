import React, { useState, useEffect } from "react";
import Table2 from "../components/Tables/Table2";
import { toast } from "react-toastify";
import { fetchReports } from "../Api/api"; // Assuming you have this function in your api.js file
import { ReportDataGenerator } from "../Utils/ReportDataGenerator";

const columns = [
  { Header: "ID", accessor: "id" },
  { Header: "MESSAGE ID", accessor: "message_id" },
  { Header: "CATEGORIES", accessor: "categories" },
  { Header: "STARTED ON", accessor: "started_on" },
  { Header: "COMPLETED ON", accessor: "completed_on" },
  { Header: "THREAT SCORE", accessor: "threat_score" },
  { Header: "STATUS", accessor: "status" },
  { Header: "EXPORT", accessor: "export" },
];

function Reports() {
  const [reportsData, setReportsData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReportsData = async () => {
    try {
      const response = await fetchReports();

      if (!response.ok) {
        throw new Error("Error fetching data");
      }

      const result = await response.json();

      if (result && result.length > 0) {
        setReportsData(result);
        toast.success("Displaying live data from API");
      } else {
        // Generate 10 random reports if no live data is available
        const generatedData = ReportDataGenerator(5);
        setReportsData(generatedData);
        toast.warn("No live data available. Displaying generated data");
      }
    } catch (error) {
      console.error("Failed to load reports data:", error);
      // Generate 10 random reports in case of API error
      const generatedData = ReportDataGenerator(5);
      setReportsData(generatedData);
      toast.error("API error. Displaying generated data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  return (
    <div className="w-full flex flex-col gap-5">
      <h1 className="text-3xl font-semibold text-secondary-foreground">
        {" "}
        Reports{" "}
      </h1>
      <div className="">
        {loading ? (
          <div className="flex justify-center items-center h-64 bg-background rounded-lg">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary dark:border-white"></div>
          </div>
        ) : (
          <Table2 data={reportsData} columns={columns} />
        )}
      </div>
    </div>
  );
}

export default Reports;
