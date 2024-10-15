import React from "react";
import Table from "../components/Tables/Table";

function Quarantine() {
  const tabData = [
    {
      label: "Status",
      headers: [
        "MESSAGE ID",
        "CATEGORIES",
        "QUARANTINED ON",
        "RELEASE DATE",
        "THREAT SCORE",
        "STATUS",
        "ACTION",
      ],
      data: [
        {
          message_id: "QRT001",
          categories: "Phishing, Malware",
          quarantined_on: "2024-04-21 10:00:00",
          release_date: "2024-04-28 10:00:00",
          threat_score: "75",
          status: "Quarantined",
          action: "Release",
        },
        {
          message_id: "QRT002",
          categories: "Spam, URLS",
          quarantined_on: "2024-04-21 11:30:00",
          release_date: "2024-04-28 11:30:00",
          threat_score: "30",
          status: "Released",
          action: "Quarantine",
        },
        {
          message_id: "QRT003",
          categories: "Attachments",
          quarantined_on: "2024-04-21 13:00:00",
          release_date: "2024-04-28 13:00:00",
          threat_score: "90",
          status: "Quarantined",
          action: "Release",
        },
        {
          message_id: "QRT004",
          categories: "URLS, Attachments",
          quarantined_on: "2024-04-21 14:30:00",
          release_date: "2024-04-28 14:30:00",
          threat_score: "50",
          status: "Under Review",
          action: "Review",
        },
      ],
    },
    {
      label: "Check Level",
      headers: [
        "MESSAGE ID",
        "CATEGORIES",
        "QUARANTINED ON",
        "RELEASE DATE",
        "THREAT SCORE",
        "STATUS",
        "ACTION",
      ],
      data: [
        {
          message_id: "QRT005",
          categories: "Phishing",
          quarantined_on: "2024-04-22 09:00:00",
          release_date: "2024-04-29 09:00:00",
          threat_score: "85",
          status: "Quarantined",
          action: "Release",
        },
        {
          message_id: "QRT006",
          categories: "Malware, URLS",
          quarantined_on: "2024-04-22 10:30:00",
          release_date: "2024-04-29 10:30:00",
          threat_score: "40",
          status: "Released",
          action: "Quarantine",
        },
        {
          message_id: "QRT007",
          categories: "Spam",
          quarantined_on: "2024-04-22 12:00:00",
          release_date: "2024-04-29 12:00:00",
          threat_score: "20",
          status: "Under Review",
          action: "Review",
        },
        {
          message_id: "QRT008",
          categories: "Attachments, URLS",
          quarantined_on: "2024-04-22 13:30:00",
          release_date: "2024-04-29 13:30:00",
          threat_score: "60",
          status: "Quarantined",
          action: "Release",
        },
      ],
    },
    {
      label: "Import Test Data",
      headers: [
        "MESSAGE ID",
        "NAME",
        "ADDRESS",
        "DATE",
        "CHECK LEVEL",
        "STATUS",
      ],
      data: [
        {
          message_id: "IMP001",
          name: "John Doe",
          address: "john.doe@example.com",
          date: "2024-04-23 09:00:00",
          check_level: "High",
          status: "Pending",
        },
        {
          message_id: "IMP002",
          name: "Jane Smith",
          address: "jane.smith@example.com",
          date: "2024-04-23 10:30:00",
          check_level: "Medium",
          status: "Approved",
        },
        {
          message_id: "IMP003",
          name: "Bob Johnson",
          address: "bob.johnson@example.com",
          date: "2024-04-23 12:00:00",
          check_level: "Low",
          status: "Rejected",
        },
        {
          message_id: "IMP004",
          name: "Alice Brown",
          address: "alice.brown@example.com",
          date: "2024-04-23 13:30:00",
          check_level: "High",
          status: "Pending",
        },
      ],
    },
  ];

  return (
    <div className="w-full flex flex-col gap-5">
      <h1 className="text-3xl font-semibold"> Quarantine </h1>
      <div className="">
        <Table tabData={tabData} />
      </div>
    </div>
  );
}

export default Quarantine;
