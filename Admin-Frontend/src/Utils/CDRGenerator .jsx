import { v4 as uuidv4 } from "uuid";

const generateRandomData = (baseCount, variance) => {
  return Array(6)
    .fill(0)
    .map(() => Math.floor(baseCount + Math.random() * variance));
};

const CDRGenerator = () => {
  const totalMails = Math.floor(Math.random() * 10000) + 40000;
  const sandboxTests = Math.floor(Math.random() * 2000) + 9000;
  const cdrCompleted = Math.floor(Math.random() * 1000) + 3500;
  const impactionsFound = Math.floor(Math.random() * 500) + 1800;

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
    totalMail: {
      icon: "MdEmail",
      title: "Total Mail",
      initialCount: totalMails,
      chartData: generateRandomData(totalMails, 5000),
      chartLabel: "Emails",
      recentMails: Array(10).fill(null).map(generateMailData),
    },
    sandboxTesting: {
      icon: "LuBoxes",
      title: "Sandbox Testing",
      initialCount: sandboxTests,
      chartData: generateRandomData(sandboxTests, 1000),
      chartLabel: "Tests",
      recentTests: Array(10).fill(null).map(generateSandboxTest),
    },
    cdrCompleted: {
      icon: "FaChartLine",
      title: "CDR Completed",
      initialCount: cdrCompleted,
      chartData: generateRandomData(cdrCompleted, 500),
      chartLabel: "CDRs",
    },
    impactionsFound: {
      icon: "GoAlertFill",
      title: "Impected Found",
      initialCount: impactionsFound,
      chartData: generateRandomData(impactionsFound, 200),
      chartLabel: "Impections",
    },
  };
};

export default CDRGenerator;
