import { v4 as uuidv4 } from "uuid";

const generateDummyLicenses = (count) => {
  return Array.from({ length: count }, (_, index) => {
    const licenseId = uuidv4().slice(0, 8);
    const pluginId = uuidv4().slice(0, 8);
    const validFrom = new Date();
    const validTill = new Date(validFrom.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    const baseData = {
      license_id: licenseId,
      organisation: `Org${index + 1}`,
      valid_from: validFrom.toISOString(),
      valid_till: validTill.toISOString(),
      status: Math.random() > 0.5 ? "1" : "0",
    };

    // Generate different types of data
    if (index % 3 === 0) {
      // Available License
      return {
        ...baseData,
        allocated_to: "",
        plugins: [],
      };
    } else if (index % 3 === 1) {
      // Allocated License
      return {
        ...baseData,
        allocated_to: `user${index + 1}@example.com`,
        plugins: [
          {
            plugin_id: pluginId,
            license_id: licenseId,
            browser: "chrome",
            ip_add: `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(
              Math.random() * 256
            )}`,
            install_date: new Date().toISOString(),
            create_timestamp: new Date().toISOString(),
            last_updated_timestamp: new Date().toISOString(),
          },
        ],
      };
    } else {
      // Uninstall License
      return {
        ...baseData,
        allocated_to: `user${index + 1}@example.com`,
        plugins: [],
      };
    }
  });
};

export default generateDummyLicenses;
