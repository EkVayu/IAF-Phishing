import React, { useState, useEffect } from "react";
import Table2 from "../components/Tables/Table2";
import { fetchQuarantineData } from "../Api/api";
import { toast } from "react-toastify";

function Quarantine() {
  const [quarantineData, setQuarantineData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const columns = [
    { Header: "Message ID", accessor: "msg_id" },
    { Header: "AI Status", accessor: "ai_status" },
    { Header: "Created At", accessor: "created_at" },
    { Header: "AI Sent At", accessor: "ai_sended_at" },
    { Header: "Attachment", accessor: "attachment" },
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

        // if (Array.isArray(result) && result.length === 0) {
        //   setError("No quarantine data available");
        //   toast.info("No quarantine data available");
        // }

        setQuarantineData(Array.isArray(result) ? result : []);

        setQuarantineData(result);
      } catch (err) {
        console.error("Error fetching quarantine data:", err);
        setError(`Failed to load data: ${err.message}`);
        toast.error(`Failed to load data: ${err.message}`);
        setQuarantineData([]); 
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
         data={quarantineData || []} 
          columns={columns}
          error={error}
          loading={loading}
          setError={setError}
        />
      </div>
    </div>
  );
}

export default Quarantine;
