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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      const response = await fetchReports();

      if (response.ok) {
        const result = await response.json();
        setReportsData(result);
        setLoading(false);
      } else if (result.length === 0) {
        setError("No data available!");
        toast.info("No data available!");
        setLoading(false);
      } else {
        setError("Server response not Ok!");
        toast.warn("Server response not Ok!");
        setLoading(false);
        throw new Error("Error fetching data");
      }
    } catch (error) {
      console.error("Failed to load reports data:", error);
      const dummyData = ReportDataGenerator(5); // Generate 10 dummy reports
      setReportsData(dummyData);
      toast.error(`API error: ${error.message}`);
      // setError(`API error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  return (
    <div className="w-full flex flex-col gap-5">
      <h1 className="text-3xl font-semibold text-secondary-foreground tracking-widest">
        {" "}
        Reports{" "}
      </h1>
      <div className="">
        {/* {loading ? (
          <div className="flex justify-center items-center h-64 bg-background rounded-lg">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary dark:border-white"></div>
          </div>
        ) : ( */}
          <Table2 data={reportsData} columns={columns} error={error} loading={loading} />
        {/* )} */}
      </div>
    </div>
  );
}

export default Reports;
