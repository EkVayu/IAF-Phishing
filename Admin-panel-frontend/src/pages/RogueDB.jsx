import React from "react";
import Table from "../components/Tables/Table";

const tabData = [
  {
    label: "URL",
    headers: ["URL", "Scheme", "HTTP Status Code", "Content Type"],
    data: [
      {
        url: "https://example.com",
        scheme: "HTTPS",
        http_status_code: 200,
        content_type: "text/html",
      },
      {
        url: "http://test.org",
        scheme: "HTTP",
        http_status_code: 200,
        content_type: "text/plain",
      },
      {
        url: "https://api.service.com",
        scheme: "HTTPS",
        http_status_code: 200,
        content_type: "application/json",
      },
    ],
  },
  {
    label: "Domain",
    headers: [
      "Domain",
      "IP",
      "ASN",
      "ASN Name",
      "Latitude",
      "Longitude",
      "Organization",
      "Host Name",
    ],
    data: [
      {
        domain: "example.com",
        ip: "93.184.216.34",
        asn: "AS15133",
        asn_name: "EdgeCast Networks",
        latitude: "34.0522",
        longitude: "-118.2437",
        organization: "EdgeCast",
        host_name: "example-host1",
      },
      {
        domain: "google.com",
        ip: "172.217.167.78",
        asn: "AS15169",
        asn_name: "Google LLC",
        latitude: "37.4192",
        longitude: "-122.0574",
        organization: "Google",
        host_name: "lax17s34-in-f14",
      },
    ],
  },
  {
    label: "Mail ID",
    headers: ["Sr. No.", "Mail ID", "Threat Score"],
    data: [
      { sr_no: 1, mail_id: "john.doe@example.com", threat_score: 20 },
      { sr_no: 2, mail_id: "alice.smith@company.org", threat_score: 5 },
      { sr_no: 3, mail_id: "bob.johnson@mail.com", threat_score: 75 },
    ],
  },
];

function RogueDB() {
  return (
    <div className="w-full flex flex-col gap-5">
      <h1 className="text-3xl font-semibold"> Rogue DB </h1>
      <div className="">
        <Table tabData={tabData} />
      </div>
    </div>
  );
}

export default RogueDB;
