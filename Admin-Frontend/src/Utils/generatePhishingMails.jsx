import { faker } from "@faker-js/faker";

export function generatePhishingMails(count = 5) {
  return Array.from({ length: count }, (_, index) => ({
    email_details: [
      {
        id: index + 1,
        u_id: faker.string.alphanumeric(4),
        recievers_email: faker.internet.email(),
        senders_email: faker.internet.email(),
        eml_file_name: faker.system.fileName(),
        plugin_id: `license${faker.string.alphanumeric(3)}`,
        message_id: faker.string.alphanumeric(6),
        status: faker.helpers.arrayElement(["safe", "unsafe"]),
        subject: faker.lorem.sentence(),
        urls: faker.internet.url(),
        create_time: faker.date.recent().toISOString(),
      },
    ],
    dispute_info: [
      {
        id: index + 1,
        created_at: faker.date.recent().toISOString(),
        updated_at: faker.date.recent().toISOString(),
        user_comment: faker.lorem.sentence(),
        admin_comment: faker.lorem.sentence(),
        counter: faker.number.int({ min: 0, max: 5 }),
        is_active: faker.datatype.boolean(),
        dispute: index + 1,
        created_by: faker.number.int({ min: 1, max: 10 }),
        updated_by: faker.number.int({ min: 1, max: 10 }),
      },
    ],
  }));
}
