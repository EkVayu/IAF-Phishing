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
      try {
        const response = await fetchPhishingMails();
        if (!response.ok) {
          throw new Error("Error fetching data");
        }
        const result = await response.json();

        if (result && result.length > 0) {
          const formattedData = result.flatMap((mailGroup) =>
            mailGroup.email_details.map((mail) => ({
              ...mail,
              user_comment: mailGroup.dispute_info[0]?.user_comment || "N/A",
              admin_comment: mailGroup.dispute_info[0]?.admin_comment || "N/A",
            }))
          );
          setPhishingMails(formattedData);
          toast.success("Data loaded successfully");
        } else if (result.length === 0) {
          setError("No data available!");
          toast.info("No data available!");
        } else {
          // setError("Server response not Ok!");
          toast.warn("Server response not Ok!");
          const generatedData = generatePhishingMails(5);
          const formattedGeneratedData = generatedData.flatMap((mailGroup) =>
            mailGroup.email_details.map((mail) => ({
              ...mail,
              user_comment: mailGroup.dispute_info[0]?.user_comment || "N/A",
              admin_comment: mailGroup.dispute_info[0]?.admin_comment || "N/A",
            }))
          );
          setPhishingMails(formattedGeneratedData);
        }
      } catch (error) {
        console.error("Error fetching phishing mails:", error);
        const generatedData = generatePhishingMails(5);
        const formattedGeneratedData = generatedData.flatMap((mailGroup) =>
          mailGroup.email_details.map((mail) => ({
            ...mail,
            user_comment: mailGroup.dispute_info[0]?.user_comment || "N/A",
            admin_comment: mailGroup.dispute_info[0]?.admin_comment || "N/A",
          }))
        );
        setPhishingMails(formattedGeneratedData);
        toast.error(`API error: ${error.message}`);
        // setError(`API error: ${error.message}`);
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
      <h1 className="text-3xl font-semibold text-secondary-foreground tracking-widest">
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

// import React, { useState, useEffect } from "react";
// import { toast } from "react-toastify";
// import { fetchPhishingMails } from "../Api/api";
// import { Link } from "react-router-dom";

// function PhishingMails() {
//   const columns = [
//     { key: "id", label: "ID" },
//     { key: "u_id", label: "User ID" },
//     { key: "recievers_email", label: "Receiver Email" },
//     { key: "senders_email", label: "Sender Email" },
//     { key: "eml_file_name", label: "EML File" },
//     { key: "plugin_id", label: "Plugin ID" },
//     { key: "msg_id", label: "Message ID" },
//     { key: "status", label: "Status" },
//     { key: "subject", label: "Subject" },
//     { key: "urls", label: "URLs" },
//     { key: "create_time", label: "Created At" },
//     { key: "bcc", label: "BCC" },
//     { key: "cc", label: "CC" },
//     { key: "attachments", label: "Attachments" },
//     { key: "ipv4", label: "IPv4" },
//     { key: "browser", label: "Browser" },
//     { key: "email_body", label: "Email Body" },
//     { key: "cdr_file", label: "CDR File" },
//   ];

//   const [phishingMails, setPhishingMails] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await fetchPhishingMails();
//         const data = await response.json();
//         setPhishingMails(data.email_details);
//         toast.success("Data loaded successfully");
//       } catch (error) {
//         console.error("Error fetching data:", error);
//         toast.error("Failed to load data");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   const filteredMails = phishingMails.filter((mail) =>
//     Object.values(mail).some((value) =>
//       String(value || "")
//         .toLowerCase()
//         .includes(searchTerm.toLowerCase())
//     )
//   );

//   const renderCellContent = (mail, column) => {
//     const value = mail[column.key];

//     if (column.key === "status") {
//       return (
//         <span
//           className={`px-2 py-1 rounded-md text-sm ${
//             value === "safe"
//               ? "bg-green-100 text-green-800"
//               : "bg-red-100 text-red-800"
//           }`}
//         >
//           {value || "N/A"}
//         </span>
//       );
//     }

//     if (column.key === "cdr_file" && value) {
//       return (
//         <Link
//           to={value}
//           className="text-blue-600 hover:text-blue-800"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           View File
//         </Link>
//       );
//     }

//     if (column.key === "create_time" && value) {
//       return new Date(value).toLocaleString();
//     }

//     return value || "N/A";
//   };

//   return (
//     <div className="w-full">
//       <div className="mb-6">
//         <h1 className="text-3xl font-semibold text-gray-800 mb-4">
//           Phishing Mails
//         </h1>
//         <input
//           type="text"
//           placeholder="Search..."
//           className="w-full max-w-md px-4 py-2 border rounded-lg"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//       </div>

//       {loading ? (
//         <div className="text-center py-4">Loading...</div>
//       ) : (
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm text-left text-gray-500 bg-background">
//             <thead className="bg-primary text-white">
//               <tr className="dark:border bg-primary dark:bg-gray-800">
//                 {columns.map((column) => (
//                   <th
//                     key={column.key}
//                     className="px-6 py-3 text-center cursor-pointer text-white text-xs uppercase"
//                   >
//                     {column.label}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {filteredMails.map((mail) => (
//                 <tr
//                   key={mail.id}
//                   className="border hover:bg-gray-200 dark:hover:bg-gray-900"
//                 >
//                   {columns.map((column) => (
//                     <td
//                       key={column.key}
//                       className="px-6 text-center py-2 whitespace-nowrap text-secondary-foreground"
//                     >
//                       {renderCellContent(mail, column)}
//                     </td>
//                   ))}
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }

// export default PhishingMails;
