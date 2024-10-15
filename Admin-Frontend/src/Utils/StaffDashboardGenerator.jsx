import { v4 as uuidv4 } from "uuid";

const generateRandomData = (baseCount, variance) => {
  return Array(6)
    .fill(0)
    .map(() => Math.floor(baseCount + Math.random() * variance));
};

const StaffDashboardGenerator = () => {
  const totalMails = Math.floor(Math.random() * 50000) + 40000;
  const sandboxTests = Math.floor(Math.random() * 5000) + 8000;
  const cdrCompleted = Math.floor(Math.random() * 2000) + 3000;
  const impactionsFound = Math.floor(Math.random() * 1000) + 1500;

  const generateMailData = () => ({
    id: uuidv4(),
    subject: `Mail ${Math.floor(Math.random() * 1000)}`,
    sender: `sender${Math.floor(Math.random() * 100)}@example.com`,
    date: new Date(Date.now() - Math.random() * 30000000000).toISOString(),
  });

  const generateSandboxTest = () => ({
    id: uuidv4(),
    testName: `Test ${Math.floor(Math.random() * 1000)}`,
    status: Math.random() > 0.2 ? "Completed" : "In Progress",
    date: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
  });

  return {
    totalMails: {
      count: totalMails,
      chartData: generateRandomData(totalMails, 5000),
      recentMails: Array(10).fill(null).map(generateMailData),
    },
    sandboxTesting: {
      count: sandboxTests,
      chartData: generateRandomData(sandboxTests, 1000),
      recentTests: Array(10).fill(null).map(generateSandboxTest),
    },
    cdrCompleted: {
      count: cdrCompleted,
      chartData: generateRandomData(cdrCompleted, 500),
    },
    impactionsFound: {
      count: impactionsFound,
      chartData: generateRandomData(impactionsFound, 200),
    },
  };
};

export default StaffDashboardGenerator;
