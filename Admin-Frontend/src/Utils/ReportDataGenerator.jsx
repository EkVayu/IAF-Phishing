import { faker } from "@faker-js/faker";

export function ReportDataGenerator(count = 10) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    message_id: `MSG${faker.string.numeric(3).padStart(3, "0")}`,
    categories: faker.helpers
      .arrayElements(
        ["Email", "Attachment", "URL", "Phishing", "Malware", "Spam"],
        2
      )
      .join(", "),
    started_on: faker.date
      .recent()
      .toISOString()
      .replace("T", " ")
      .slice(0, 19),
    completed_on: faker.date
      .recent()
      .toISOString()
      .replace("T", " ")
      .slice(0, 19),
    threat_score: faker.number.int({ min: 0, max: 100 }),
    status: faker.helpers.arrayElement(["Completed", "Processing"]),
    export: "Download",
  }));
}
