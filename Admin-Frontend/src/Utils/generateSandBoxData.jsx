import { faker } from "@faker-js/faker";

export function generateSandBoxData(numEntries = 5) {
  const categories = ["Phishing", "Malware", "Spam", "URLS", "Attachments"];
  const statuses = ["Completed", "Processing", "Failed"];

  function generateEntry() {
    const startDate = faker.date.recent();
    const endDate = new Date(
      startDate.getTime() +
        faker.number.int({ min: 5 * 60000, max: 30 * 60000 })
    );

    return {
      message_id: `MSG${faker.string.alphanumeric(3).toUpperCase()}`,
      categories: faker.helpers
        .arrayElements(categories, { min: 1, max: 3 })
        .join(", "),
      started_on: startDate.toISOString().replace("T", " ").substring(0, 19),
      completed_on: endDate.toISOString().replace("T", " ").substring(0, 19),
      threat_score: faker.number.int({ min: 0, max: 100 }).toString(),
      status: faker.helpers.arrayElement(statuses),
      detailed_report: faker.helpers.arrayElement(["View", "N/A"]),
    };
  }

  return [
    {
      label: "Run Test",
      headers: [
        "MESSAGE ID",
        "CATEGORIES",
        "STARTED ON",
        "COMPLETED ON",
        "THREAT SCORE",
        "STATUS",
        "DETAILED REPORT",
      ],
      data: Array.from({ length: numEntries }, generateEntry),
    },
    {
      label: "Fetch Data",
      headers: [
        "MESSAGE ID",
        "CATEGORIES",
        "STARTED ON",
        "COMPLETED ON",
        "THREAT SCORE",
        "STATUS",
        "DETAILED REPORT",
      ],
      data: Array.from({ length: numEntries }, generateEntry),
    },
  ];
}
