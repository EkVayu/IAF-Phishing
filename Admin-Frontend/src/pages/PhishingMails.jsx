import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Table2 from "../components/Tables/Table2";
import { fetchPhishingMails, updatePhishingMailStatus } from "../Api/api";
import { generatePhishingMails } from "../Utils/generatePhishingMails";

function PhishingMails() {
  const [phishingMails, setPhishingMails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const columns = [
    { Header: "ID", accessor: "id" },
    { Header: "User ID", accessor: "u_id" },
    { Header: "Receiver's Email", accessor: "recievers_email" },
    { Header: "Sender's Email", accessor: "senders_email" },
    { Header: "Plugin ID", accessor: "plugin_id" },
    { Header: "Message ID", accessor: "message_id" },
    { Header: "Status", accessor: "status" },
    { Header: "Subject", accessor: "subject" },
    { Header: "Created At", accessor: "create_time" },
    { Header: "User Comment", accessor: "user_comment" },
    { Header: "Admin Comment", accessor: "admin_comment" },
  ];

  useEffect(() => {
    const getPhishingMails = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetchPhishingMails();
        const result = await response.json();
        let formattedData;

        if (response.ok && result.length > 0) {
          formattedData = result.flatMap((mailGroup) =>
            mailGroup.email_details.map((mail) => ({
              ...mail,
              user_comment: mailGroup.dispute_info[0]?.user_comment || "N/A",
              admin_comment: mailGroup.dispute_info[0]?.admin_comment || "N/A",
            }))
          );
        } else {
          // Use generated data if API returns no data
          const generatedData = generatePhishingMails(5); // Generate 5 phishing mail entries
          formattedData = generatedData.flatMap((mailGroup) =>
            mailGroup.email_details.map((mail) => ({
              ...mail,
              user_comment: mailGroup.dispute_info[0]?.user_comment || "N/A",
              admin_comment: mailGroup.dispute_info[0]?.admin_comment || "N/A",
            }))
          );
        }

        setPhishingMails(formattedData);
        toast.success("Phishing mails data loaded successfully!");
      } catch (error) {
        console.error("Error fetching phishing mails:", error);
        // Use generated data in case of error
        const generatedData = generatePhishingMails(5);
        const formattedGeneratedData = generatedData.flatMap((mailGroup) =>
          mailGroup.email_details.map((mail) => ({
            ...mail,
            user_comment: mailGroup.dispute_info[0]?.user_comment || "N/A",
            admin_comment: mailGroup.dispute_info[0]?.admin_comment || "N/A",
          }))
        );
        setPhishingMails(formattedGeneratedData);
        toast.warning("API error. Displaying generated data");
      } finally {
        setLoading(false);
      }
    };

    getPhishingMails();
  }, []);

  const handleStatusChange = async (
    receiverEmail,
    messageId,
    adminComment = null,
    newStatus
  ) => {
    try {
      const response = await updatePhishingMailStatus(
        newStatus,
        receiverEmail,
        messageId,
        adminComment
      );
      if (response.ok) {
        setPhishingMails((prevMails) =>
          prevMails.map((mail) =>
            mail.message_id === messageId &&
            mail.recievers_email === receiverEmail
              ? {
                  ...mail,
                  status: newStatus,
                  admin_comment: adminComment || mail.admin_comment,
                }
              : mail
          )
        );
        toast.success(
          adminComment
            ? "Status and admin comment updated successfully!"
            : "Status updated successfully!"
        );
      } else {
        const errorData = await response.json();
        toast.error(`Failed to update status: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status. Please try again.");
    }
  };

  return (
    <div className="w-full flex flex-col gap-5">
      <h1 className="text-3xl font-semibold text-secondary-foreground">
        Phishing Mails
      </h1>
      <Table2
        data={phishingMails}
        columns={columns}
        onStatusChange={handleStatusChange}
        loading={loading}
        error={error}
      />
    </div>
  );
}

export default PhishingMails;
