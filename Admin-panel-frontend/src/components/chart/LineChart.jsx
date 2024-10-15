import React from "react";
import { Line } from "react-chartjs-2";
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
  const chartData = {
    // labels: apiResponse.months || ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], // Use months from API response if available
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "July", "Aug", "Sep"], // Use months from API response if available
    datasets: [
      {
        label: label,
        data: data,
        borderColor: "#3749A6", // Main line color
        backgroundColor: "rgba(55, 73, 166, 0.3)", // Gradient background effect
        borderWidth: 3,
        fill: true, // Fill under the line for a smoother look
        pointBackgroundColor: "#ffffff", // Color of points
        pointBorderColor: "#3749A6",
        tension: 0.4, // Smooth curve instead of straight lines
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#3749A6", // Legend label color
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
          color: "#3749A6", // X-axis label color
        },
      },
      y: {
        grid: {
          color: "#f0f0f0", // Lighter grid lines for y-axis
        },
        ticks: {
          color: "#3749A6", // Y-axis label color
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
