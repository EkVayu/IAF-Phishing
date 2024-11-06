import { v4 as uuidv4 } from "uuid";

const generateRandomData = (baseCount, variance) => {
  return Array(6)
    .fill()
    .map(() => Math.floor(baseCount + Math.random() * variance));
};

const SuperAdminDashboardGenerate = () => {
  const userCount = Math.floor(Math.random() * 1000) + 500; // Random number between 500 and 1500
  const licenseCount = Math.floor(Math.random() * 500) + 200; // Random number between 200 and 700

  const users = Array(userCount)
    .fill()
    .map((_, index) => ({
      id: uuidv4(),
      name: `User ${index + 1}`,
      email: `user${index + 1}@example.com`,
      // Add other user properties as needed
    }));

  const licenses = Array(licenseCount)
    .fill()
    .map((_, index) => ({
      license_id: uuidv4(),
      organisation: `Org ${index + 1}`,
      valid_from: new Date(
        Date.now() - Math.random() * 10000000000
      ).toISOString(),
      valid_till: new Date(
        Date.now() + Math.random() * 10000000000
      ).toISOString(),
      allocated_to: `user${
        Math.floor(Math.random() * userCount) + 1
      }@example.com`,
      status: Math.random() > 0.2 ? "1" : "0", // 80% chance of being active
      plugins: [
        {
          plugin_id: uuidv4(),
          browser: "chrome",
          ip_add: `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(
            Math.random() * 256
          )}`,
          install_date: new Date(
            Date.now() - Math.random() * 5000000000
          ).toISOString(),
        },
      ],
    }));

  const phishingMails = Array(Math.floor(Math.random() * 100))
    .fill()
    .map(() => ({
      id: uuidv4(),
      subject: `Phishing Mail ${Math.floor(Math.random() * 1000)}`,
      sender: `phisher${Math.floor(Math.random() * 100)}@malicious.com`,
      date: new Date(Date.now() - Math.random() * 30000000000).toISOString(),
      // Add other phishing mail properties as needed
    }));

  return {
    users: {
      results: users,
      ok: true,
    },
    licenses: {
      json: () => Promise.resolve(licenses),
      ok: true,
    },
    phishingMails: {
      json: () => Promise.resolve(phishingMails),
      ok: true,
    },
    userData: {
      count: userCount,
      chartData: generateRandomData(userCount, 3000),
    },
    licenseData: {
      count: licenseCount,
      chartData: generateRandomData(licenseCount, 600),
    },
  };
};

export default SuperAdminDashboardGenerate;
