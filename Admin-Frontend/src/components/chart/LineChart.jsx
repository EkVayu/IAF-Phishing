import React from "react";
import { Line } from "react-chartjs-2";
import { useTheme } from "../../context/theme-provider";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register the chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ChartComponent = ({ data, label }) => {
  const { theme } = useTheme();

  // Generate labels based on the length of data
  const generateLabels = (dataLength) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return months.slice(0, dataLength);
  };

  const chartData = {
    labels: generateLabels(data.length),
    datasets: [
      {
        label: label,
        data: data,
        borderColor: theme === "light" ? "#3749A6" : "#ffffff",
        backgroundColor: "rgba(55, 73, 166, 0.3)",
        borderWidth: 3,
        fill: true,
        pointBackgroundColor: "#ffffff",
        pointBorderColor: "#3749A6",
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: theme === "light" ? "#3749A6" : "#ffffff", // Legend label color
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(context.parsed.y);
            }
            return label;
          },
        },
        backgroundColor: "#3749A6", // Tooltip background
        titleColor: "#ffffff", // Tooltip title color
        bodyColor: "#ffffff", // Tooltip text color
        borderWidth: 1,
        borderColor: "#717cb6",
      },
    },
    scales: {
      x: {
        grid: {
          display: false, // Hide x-axis grid lines
        },
        ticks: {
          color: theme === "light" ? "#3749A6" : "#ffffff", // X-axis label color
        },
      },
      y: {
        grid: {
          color: "#f0f0f0", // Lighter grid lines for y-axis
        },
        ticks: {
          color: theme === "light" ? "#3749A6" : "#ffffff", // Y-axis label color
          callback: function (value) {
            return value.toLocaleString(); // Format y-axis labels
          },
        },
      },
    },
    animations: {
      tension: {
        duration: 1000,
        easing: "easeInOutQuad", // Smooth animation
        from: 0.4,
        to: 0.2,
        loop: true,
      },
    },
  };

  return <Line data={chartData} options={options} />;
};
export default ChartComponent;
