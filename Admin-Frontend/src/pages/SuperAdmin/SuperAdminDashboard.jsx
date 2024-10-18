import React, { useState, useEffect } from "react";
import { FaUsers } from "react-icons/fa";
import { GrLicense } from "react-icons/gr";
import CardComponent from "../../components/card/CardComponent";
import ChartComponent from "../../components/chart/LineChart";
import { fetchPhishingMails, fetchUsers, fetchLicenses } from "../../Api/api";
import { toast } from "react-toastify";
import SuperAdminDashboardGenerate from "../../Utils/SuperAdminDashboardGenerate";

const SuperAdminDashboard = () => {
  const [selectedCard, setSelectedCard] = useState(0);
  const [userData, setUserData] = useState({ count: 0, chartData: [] });
  const [licenseData, setLicenseData] = useState({ count: 0, chartData: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Attempt to fetch data from API
        const [userResponse, licenseResponse, phishingMailsResponse] =
          await Promise.all([
            fetchUsers(),
            fetchLicenses(),
            fetchPhishingMails(),
          ]);

        let users, licenses, phishingMails;

        // Check if API calls were successful
        if (userResponse.ok && licenseResponse.ok && phishingMailsResponse.ok) {
          users = userResponse.results || [];
          licenses = await licenseResponse.json();
          phishingMails = await phishingMailsResponse.json();
        } else {
          // If any API call fails, use generated data
          const generatedData = SuperAdminDashboardGenerate();
          users = generatedData.users.results;
          licenses = await generatedData.licenses.json();
          phishingMails = await generatedData.phishingMails.json();
          toast.warning("Using generated data due to API unavailability");
        }

        // Process user data
        const userChartData = [
          users.length,
          users.length + 1000,
          users.length + 2000,
          users.length + 1500,
          users.length + 3000,
          users.length + 2500,
        ];

        setUserData({
          count: users.length,
          chartData: userChartData,
        });

        // Process license data
        const licenseChartData = [
          licenses.length,
          licenses.length + 200,
          licenses.length + 100,
          licenses.length + 400,
          licenses.length + 300,
          licenses.length + 600,
        ];

        setLicenseData({
          count: licenses.length,
          chartData: licenseChartData,
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);

        // Use generated data as a fallback
        const generatedData = SuperAdminDashboardGenerate();
        setUserData(generatedData.userData);
        setLicenseData(generatedData.licenseData);

        toast.error("Failed to fetch data. Using generated data.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Define the card data dynamically based on fetched data
  const cardData = [
    {
      icon: <FaUsers className="w-10 h-10 text-blue-500" />,
      title: "Total Users",
      initialCount: userData.count,
      chartData: userData.chartData,
      chartLabel: "Users over time",
    },
    {
      icon: <GrLicense className="w-10 h-10 text-green-500" />,
      title: "Total License",
      initialCount: licenseData.count,
      chartData: licenseData.chartData,
      chartLabel: "Licenses over time",
    },
  ];

  const handleCardClick = (index) => {
    setSelectedCard(index);
  };

  return (
    <div className="w-full p-6 bg-background rounded-lg">
      <h1 className="text-3xl font-semibold mb-6 text-secondary-foreground">
        Dashboard
      </h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <p className="text-red-500 text-sm font-semibold">{error}</p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-6 mb-8">
            {cardData.map((card, index) => (
              <CardComponent
                key={index}
                {...card}
                onClick={() => handleCardClick(index)}
                isSelected={selectedCard === index}
              />
            ))}
          </div>

          <div className="flex gap-6">
            <div className="w-1/2 bg-background rounded-lg shadow-md dark:shadow-white p-4">
              <h2 className="text-xl font-semibold mb-4 text-secondary-foreground">
                {selectedCard !== null
                  ? cardData[selectedCard].title
                  : "Selected Card Data"}
              </h2>
              {selectedCard !== null ? (
                <ChartComponent
                  data={cardData[selectedCard].chartData}
                  label={cardData[selectedCard].chartLabel}
                />
              ) : (
                <p>Select a card to view its data</p>
              )}
            </div>
            <div className="w-1/2 grid grid-cols-2 gap-4">
              {cardData.map(
                (card, index) =>
                  index !== selectedCard && (
                    <div
                      key={index}
                      className="bg-background rounded-lg shadow-md dark:shadow-white p-4"
                    >
                      <h3 className="text-lg font-semibold mb-2 text-secondary-foreground">
                        {card.title}
                      </h3>
                      <ChartComponent
                        data={card.chartData}
                        label={card.chartLabel}
                      />
                    </div>
                  )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
