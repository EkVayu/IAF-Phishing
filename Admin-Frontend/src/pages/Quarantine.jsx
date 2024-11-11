import React, { useState, useEffect } from "react";
import Table2 from "../components/Tables/Table2";
import { fetchQuarantineData } from "../Api/api";
import { toast } from "react-toastify";

function Quarantine() {
  const [quarantineData, setQuarantineData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const columns = [
    { Header: "Message ID", accessor: "message_id" },
    { Header: "Created At", accessor: "created_at" },
    { Header: "Sender", accessor: "sender_email" },
    { Header: "Receiver", accessor: "receiver_email" },
    { Header: "Status", accessor: "status" },
    { Header: "Threat Score", accessor: "threat_score" },
    { Header: "Export", accessor: "export" },
  ];

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchQuarantineData();

        if (!response.ok) {
          toast.error(`HTTP error! Status: ${response.status}`);
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        setQuarantineData(result);
      } catch (err) {
        console.error("Error fetching quarantine data:", err);
        setError(`Failed to load data: ${err.message}`);
        toast.error(`Failed to load data: ${err.message}`);
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
        <Table2
          data={quarantineData}
          columns={columns}
          error={error}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default Quarantine;
