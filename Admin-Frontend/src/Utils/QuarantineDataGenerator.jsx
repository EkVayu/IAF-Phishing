import { faker } from "@faker-js/faker";

export function generateQuarantineData() {
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
      data: Array.from({ length: 5 }, () => ({
        message_id: `QRT${faker.string.alphanumeric(3).toUpperCase()}`,
        categories: faker.helpers
          .arrayElements(
            ["Phishing", "Malware", "Spam", "URLS", "Attachments"],
            { min: 1, max: 3 }
          )
          .join(", "),
        quarantined_on:
          faker.date.recent().toISOString().split("T")[0] +
          " " +
          faker.date.recent().toTimeString().split(" ")[0],
        release_date:
          faker.date.soon().toISOString().split("T")[0] +
          " " +
          faker.date.soon().toTimeString().split(" ")[0],
        threat_score: faker.number.int({ min: 1, max: 100 }).toString(),
        status: faker.helpers.arrayElement([
          "Quarantined",
          "Released",
          "Under Review",
        ]),
        action: faker.helpers.arrayElement(["Release", "Quarantine", "Review"]),
      })),
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
      data: Array.from({ length: 5 }, () => ({
        message_id: `QRT${faker.string.alphanumeric(3).toUpperCase()}`,
        categories: faker.helpers
          .arrayElements(
            ["Phishing", "Malware", "Spam", "URLS", "Attachments"],
            { min: 1, max: 3 }
          )
          .join(", "),
        quarantined_on:
          faker.date.recent().toISOString().split("T")[0] +
          " " +
          faker.date.recent().toTimeString().split(" ")[0],
        release_date:
          faker.date.soon().toISOString().split("T")[0] +
          " " +
          faker.date.soon().toTimeString().split(" ")[0],
        threat_score: faker.number.int({ min: 1, max: 100 }).toString(),
        status: faker.helpers.arrayElement([
          "Quarantined",
          "Released",
          "Under Review",
        ]),
        action: faker.helpers.arrayElement(["Release", "Quarantine", "Review"]),
      })),
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
      data: Array.from({ length: 5 }, () => ({
        message_id: `IMP${faker.string.alphanumeric(3).toUpperCase()}`,
        name: faker.person.fullName(),
        address: faker.internet.email(),
        date:
          faker.date.recent().toISOString().split("T")[0] +
          " " +
          faker.date.recent().toTimeString().split(" ")[0],
        check_level: faker.helpers.arrayElement(["High", "Medium", "Low"]),
        status: faker.helpers.arrayElement(["Pending", "Approved", "Rejected"]),
      })),
    },
  ];

  return tabData;
}
