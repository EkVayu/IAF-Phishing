import React, { useEffect, useState } from "react";
import CardComponent from "../components/card/CardComponent";
import ChartComponent from "../components/chart/LineChart";
import { MdEmail } from "react-icons/md";
import { LuBoxes } from "react-icons/lu";
import { FaChartLine } from "react-icons/fa";
import { GoAlertFill } from "react-icons/go";
import StaffDashboardGenerator from "../Utils/StaffDashboardGenerator";
import { fetchStaffDashboardData } from "../Api/api";
import { toast } from "react-toastify";

const StaffDashboard = () => {
  const [selectedCard, setSelectedCard] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  

  // Inside StaffDashboard component
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetchStaffDashboardData();
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
          toast.success("Dashboard data fetched successfully.");
          setIsLoading(false);
        } else {
          throw new Error(`Server response ${response.status}`);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Fallback to dummy data on error
        const dummyData = StaffDashboardGenerator();
        setDashboardData(dummyData);
        toast.error(`${error.message}! Using dummy data.`);
        setIsLoading(false);
        // setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const cardData = dashboardData
    ? [
        {
          icon: <MdEmail className="w-10 h-10 text-blue-500" />,
          title: "Total Mail",
          initialCount: dashboardData?.totalMails?.count,
          chartData: dashboardData?.totalMails?.chartData,
          chartLabel: "Emails",
        },
        {
          icon: <LuBoxes className="w-10 h-10 text-orange-500" />,
          title: "Sandbox Testing",
          initialCount: dashboardData?.sandboxTesting?.count,
          chartData: dashboardData?.sandboxTesting?.chartData,
          chartLabel: "Tests",
        },
        {
          icon: <FaChartLine className="w-10 h-10 text-green-500" />,
          title: "CDR Completed",
          initialCount: dashboardData?.cdrCompleted?.count,
          chartData: dashboardData?.cdrCompleted?.chartData,
          chartLabel: "CDRs",
        },
        {
          icon: <GoAlertFill className="w-10 h-10 text-red-500" />,
          title: "Impections Found",
          initialCount: dashboardData?.impactionsFound?.count,
          chartData: dashboardData?.impactionsFound?.chartData,
          chartLabel: "Impections",
        },
      ]
    : [];

  const handleCardClick = (index) => setSelectedCard(index);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-background rounded-lg">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary dark:border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 bg-background rounded-lg">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg">
      <h1 className="text-3xl font-semibold mb-6 text-secondary-foreground tracking-widest">
        Dashboard
      </h1>
      <div className="grid grid-cols-4 gap-6 mb-8">
        {cardData?.map((card, index) => (
          <CardComponent
            key={index}
            {...card}
            onClick={() => handleCardClick(index)}
            isSelected={selectedCard === index}
          />
        ))}
      </div>
      <div className="flex gap-6">
        <div className="w-1/2 rounded-lg shadow-lg  dark:shadow-sm dark:shadow-white p-4 bg-background dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-secondary-foreground">
            {selectedCard !== null
              ? cardData[selectedCard]?.title
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
          {cardData?.map(
            (card, index) =>
              index !== selectedCard && (
                <div
                  key={index}
                  className="rounded-lg shadow-lg dark:shadow-sm dark:shadow-white p-4 bg-background dark:bg-gray-800"
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
    </div>
  );
};

export default StaffDashboard;
