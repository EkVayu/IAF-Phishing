import React, { useEffect, useState } from "react";
import Table2 from "../components/Tables/Table2";
import { addDisputeComment, disputeStatusChange, fetchDisputes, updateDisputeStatus } from "../Api/api";
import { toast } from "react-toastify";

function Disputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const columns = [
    { Header: "Dispute ID", accessor: "dispute_id" },
    { Header: "Email", accessor: "email" },
    { Header: "Message ID", accessor: "msg_id" },
    { Header: "Counter", accessor: "counter" },
    { Header: "Status", accessor: "status" },
    { Header: "Created At", accessor: "created_at" },
    { Header: "User Comment", accessor: "user_comment" },
  ];

  useEffect(() => {
    const getDisputes = async () => {
      try {
        const response = await fetchDisputes();
        if (response.ok) {
          const result = await response.json();
          setDisputes(result.data);
        } else {
          setError("Failed to fetch disputes");
          // const dummyDisputes = generateDummyDisputes(5);
          // setDisputes(dummyDisputes);
        }
      } catch (err) {
        // const dummyDisputes = generateDummyDisputes(5);
        // setDisputes(dummyDisputes);
        setError("Error fetching disputes: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    getDisputes();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await updateDisputeStatus(id, newStatus);
      if (response.ok) {
        const updatedData = await response.json();
        setPhishingMails((prevMails) =>
          prevMails.map((mail) =>
            mail.id === id ? { ...mail, status: updatedData.status } : mail
          )
        );
        toast.success("Status updated successfully!");
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleCommentAdd = async (id, comment) => {
    try {
      const response = await addDisputeComment(id, comment);
      if (response.ok) {
        const updatedData = await response.json();
        setPhishingMails((prevMails) =>
          prevMails.map((mail) =>
            mail.id === id
              ? { ...mail, admin_comment: updatedData.admin_comment }
              : mail
          )
        );
        toast.success("Comment added successfully!");
      } else {
        toast.error("Failed to add comment");
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    }
  };

  // const handleStatusChange = async (
  //   receiverEmail,
  //   messageId,
  //   adminComment = null,
  //   newStatus
  // ) => {
  //   try {
  //     const response = await disputeStatusChange(
  //       newStatus,
  //       receiverEmail,
  //       messageId,
  //       adminComment
  //     );

  //     if (response.ok) {
  //       setDisputes((prevDisputes) =>
  //         prevDisputes.map((dispute) =>
  //           dispute.msg_id === messageId && dispute.email === receiverEmail
  //             ? {
  //                 ...dispute,
  //                 status: newStatus,
  //                 admin_comment: adminComment || dispute.admin_comment,
  //               }
  //             : dispute
  //         )
  //       );

  //       toast.success(
  //         adminComment
  //           ? "Status and admin comment updated successfully!"
  //           : "Status updated successfully!"
  //       );
  //     } else {
  //       const errorData = await response.json();
  //       toast.error(`Failed to update status: ${errorData.message}`);
  //     }
  //   } catch (error) {
  //     console.error("Error updating status:", error);
  //     toast.error("Failed to update status. Please try again.");
  //   }
  // };

  return (
    <div className="w-full flex flex-col gap-5">
      <h1 className="text-3xl font-semibold text-secondary-foreground tracking-widest">
        Disputes
      </h1>
      <Table2
        data={disputes}
        onStatusChange={handleStatusChange}
        onCommentAdd={handleCommentAdd}
        columns={columns}
        loading={loading}
        error={error}
      />
    </div>
  );
}

export default Disputes;
