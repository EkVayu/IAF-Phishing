import React, { useState, useEffect } from "react";
import Table2 from "../components/Tables/Table2";
import { table2Data } from "../mockData";
import { toast } from "react-toastify";
import { fetchReports } from "../Api/api"; // Assuming you have this function in your api.js file

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
        setReportsData(table2Data);
        toast.info("No live data available. Displaying dummy data");
      }
    } catch (error) {
      console.error("Failed to load reports data:", error);
      setReportsData(table2Data);
      toast.warning("API error. Displaying dummy data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  return (
    <div className="w-full flex flex-col gap-5">
      <h1 className="text-3xl font-semibold"> Reports </h1>
      <div className="">
        {loading ? (
          <div className="flex justify-center items-center h-64 bg-background rounded-lg">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Table2 data={reportsData} columns={columns} />
        )}
      </div>
    </div>
  );
}

export default Reports;
