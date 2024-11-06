import { v4 as uuidv4 } from "uuid";

const generateDummyDisputes = (count) => {
  return Array.from({ length: count }, (_, index) => {
    const disputeId = uuidv4().slice(0, 8);
    const msgId = uuidv4().slice(0, 12);
    const createdAt = new Date(
      Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
    );

    const statusOptions = ["safe", "unsafe"];
    const randomStatus =
      statusOptions[Math.floor(Math.random() * statusOptions.length)];

    return {
      dispute_id: disputeId,
      email: `user${index + 1}@example.com`,
      msg_id: `MSG_${msgId}`,
      counter: Math.floor(Math.random() * 10) + 1,
      status: randomStatus,
      created_at: createdAt.toISOString(),
      user_comment: `Lorem ipsum dolor sit amet.`,
    };
  });
};

export default generateDummyDisputes;
