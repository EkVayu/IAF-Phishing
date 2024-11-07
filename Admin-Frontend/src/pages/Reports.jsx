import React, { useState, useEffect } from "react";
import Table2 from "../components/Tables/Table2";
import { toast } from "react-toastify";
import { fetchReports } from "../Api/api";

const columns = [
  { Header: "S.No", accessor: "S.No" },
  { Header: "License Key", accessor: "License Key" },
  { Header: "Allocated Email", accessor: "Allocated Email" },
  { Header: "Allocation Date", accessor: "Allocation Date" },
  { Header: "Revoke Date", accessor: "Revoke Date" },
  { Header: "Status", accessor: "Status" },
];

function Reports() {
  const [reportsData, setReportsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      const response = await fetchReports();
      const result = await response.json();
      console.log(result);

      if (response.ok) {
        setReportsData(result.data);
        setLoading(false);
      } else if (result.data.length === 0) {
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
      // const dummyData = ReportDataGenerator(5); // Generate 10 dummy reports
      // setReportsData(dummyData);
      toast.error(`API error: ${error.message}`);
      setError(`API error: ${error.message}`);
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
        Reports
      </h1>
      <div className="">
        <Table2
          data={reportsData}
          columns={columns}
          error={error}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default Reports;
