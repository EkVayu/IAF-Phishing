import React, { useState } from "react";
import CardComponent from "../components/card/CardComponent";
import ChartComponent from "../components/chart/LineChart";
import { MdEmail } from "react-icons/md";
import { LuBoxes } from "react-icons/lu";
import { FaChartLine } from "react-icons/fa";
import { GoAlertFill } from "react-icons/go";

function CDR() {
  const [selectedCard, setSelectedCard] = useState(0);

  const cardData = [
    {
      icon: <MdEmail className="w-10 h-10 text-blue-500" />,
      title: "Total Mail",
      initialCount: 45000,
      chartData: [1000, 2000, 3000, 2500, 4000, 3500],
      chartLabel: "Emails",
    },
    {
      icon: <LuBoxes className="w-10 h-10 text-orange-500" />,
      title: "Sandbox Testing",
      initialCount: 10200,
      chartData: [200, 400, 300, 600, 500, 800],
      chartLabel: "Tests",
    },
    {
      icon: <FaChartLine className="w-10 h-10 text-green-500" />,
      title: "CDR Completed",
      initialCount: 4016,
      chartData: [100, 150, 200, 180, 250, 300],
      chartLabel: "CDRs",
    },
    {
      icon: <GoAlertFill className="w-10 h-10 text-red-500" />,
      title: "Impected Found",
      initialCount: 2040,
      chartData: [50, 80, 100, 90, 120, 150],
      chartLabel: "Impections",
    },
  ];

  const handleCardClick = (index) => {
    setSelectedCard(index);
  };

  return (
    <div className="w-full p-6 bg-gray-100">
      <h1 className="text-3xl font-semibold mb-6">CDR</h1>
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
        <div className="w-1/2 bg-background rounded-lg shadow-md p-4">
          <h2 className="text-xl font-semibold mb-4">
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
          {cardData?.map(
            (card, index) =>
              index !== selectedCard && (
                <div key={index} className="bg-background rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
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
}

export default CDR;
