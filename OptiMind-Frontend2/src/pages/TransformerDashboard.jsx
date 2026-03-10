import React, { useEffect, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useLocation } from "react-router-dom";
import axios from "axios";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const TransformerDashboard = () => {
  const stored = localStorage.getItem("forecast_analysis");
  const data = stored ? JSON.parse(stored) : null;
  if (!data) {
    return <h2 style={{ textAlign: "center" }}>No analysis data found</h2>;
  }

  if (!data) {
    return <h2>Loading Transformer Dashboard...</h2>;
  }

  const ranges = {
    "0-20": 0,
    "20-40": 0,
    "40-60": 0,
    "60-80": 0,
    "80+": 0,
  };

  data.demand_distribution.forEach((value) => {
    if (value < 20) ranges["0-20"]++;
    else if (value < 40) ranges["20-40"]++;
    else if (value < 60) ranges["40-60"]++;
    else if (value < 80) ranges["60-80"]++;
    else ranges["80+"]++;
  });

  const distributionData = Object.keys(ranges).map((key) => ({
    range: key,
    count: ranges[key],
  }));
  const trendData = data.demand_distribution.map((value, index) => ({
    day: index + 1,
    demand: value,
  }));
  const highestDemand = Math.max(...data.demand_distribution);
  const lowestDemand = Math.min(...data.demand_distribution);
  const highDemandProduct = data.top_products[0];
  const lowDemandProduct = data.low_products[0];
  const [topSortOrder, setTopSortOrder] = useState("desc");
  const [lowSortOrder, setLowSortOrder] = useState("asc");
  const sortedTopProducts = [...data.top_products].sort((a, b) => {
    return topSortOrder === "asc"
      ? a.Predicted_Demand - b.Predicted_Demand
      : b.Predicted_Demand - a.Predicted_Demand;
  });

  const sortedLowProducts = [...data.low_products].sort((a, b) => {
    return lowSortOrder === "asc"
      ? a.Predicted_Demand - b.Predicted_Demand
      : b.Predicted_Demand - a.Predicted_Demand;
  });

  const totalProducts = data.demand_distribution.length;

  const avg = data.avg_predicted_demand;

  const highDemandCount = data.demand_distribution.filter(
    (d) => d > avg * 1.1,
  ).length;

  const lowDemandCount = data.demand_distribution.filter(
    (d) => d < avg * 0.9,
  ).length;

  const aboveAverageCount = data.demand_distribution.filter(
    (d) => d > avg,
  ).length;

  const aboveAveragePercent = (
    (aboveAverageCount / totalProducts) *
    100
  ).toFixed(1);

  // FIXED DOWNLOAD FUNCTION FOR DARK THEME
  // FIXED DOWNLOAD FUNCTION WITH FULL SCROLLING SUPPORT
  const downloadReport = async () => {
    const element = document.getElementById("dashboard-report");
    const btn = document.getElementById("download-btn-ui");

    if (btn) btn.style.visibility = "hidden"; // Hide button during capture

    // Capture the entire height of the element, even the scrolled parts
    const canvas = await html2canvas(element, {
      backgroundColor: "#121212", // Forces dark background
      scale: 2, // High resolution
      logging: false,
      useCORS: true,
      height: element.scrollHeight, // Capture full height
      windowHeight: element.scrollHeight, // Ensure virtual window sees everything
    });

    if (btn) btn.style.visibility = "visible";

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Add the first page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // If the content is longer than one page, loop and add new pages
    while (heightLeft > 0) {
      position = heightLeft - imgHeight; // Calculate offset for the next slice
      pdf.addPage();

      // Maintain the dark background on new pages
      pdf.setFillColor(18, 18, 18); // RGB for #121212
      pdf.rect(0, 0, 210, 297, "F");

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save("forecast_dashboard_report.pdf");
  };
  return (
    <div id="dashboard-report" style={{ padding: "30px" }}>
      <h1 style={{ textAlign: "center" }}>
        Transformer Demand Forecast Dashboard
      </h1>
      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <button onClick={downloadReport} style={downloadBtnStyle}>
          Download Analysis Report (PDF)
        </button>
      </div>

      {/* KPI CARDS */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          marginTop: "20px",
          flexWrap: "wrap",
        }}
      >
        <div style={cardStyle}>
          <h3>Total Products</h3>
          <h2>{data.total_products}</h2>
        </div>

        <div style={cardStyle}>
          <h3>Avg Predicted Demand</h3>
          <h2>{data.avg_predicted_demand.toFixed(2)}</h2>
        </div>

        <div style={cardStyle}>
          <h3>Highest Demand</h3>
          <h2>{highestDemand.toFixed(2)}</h2>
        </div>

        <div style={cardStyle}>
          <h3>Lowest Demand</h3>
          <h2>{lowestDemand.toFixed(2)}</h2>
        </div>
      </div>

      {/* MODEL INFORMATION */}
      <h2 style={{ marginTop: "40px" }}>Model Information</h2>

      <div style={{ display: "flex", gap: "20px", marginTop: "10px" }}>
        <div style={cardStyle}>
          <h3>Model Used</h3>
          <p>Transformer</p>
        </div>

        <div style={cardStyle}>
          <h3>Forecast Type</h3>
          <p>Time Series</p>
        </div>

        <div style={cardStyle}>
          <h3>Input Window</h3>
          <p>28 Days</p>
        </div>
      </div>

      {/* DEMAND ALERTS */}
      <h2 style={{ marginTop: "40px" }}>Demand Alerts</h2>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <div style={alertHighStyle}>
          <h3>⚠ High Demand Alert</h3>
          <p>
            Product <b>{highDemandProduct.SKU_ID}</b> has very high predicted
            demand of <b> {highDemandProduct.Predicted_Demand.toFixed(2)}</b>.
          </p>
        </div>

        <div style={alertLowStyle}>
          <h3>⚠ Low Demand Alert</h3>
          <p>
            Product <b>{lowDemandProduct.SKU_ID}</b> has very low predicted
            demand of <b> {lowDemandProduct.Predicted_Demand.toFixed(2)}</b>.
          </p>
        </div>
      </div>

      {/* SIDE-BY-SIDE TABLES CONTAINER */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          marginTop: "40px",
          alignItems: "flex-start",
        }}
      >
        {/* TOP PRODUCTS SECTION */}
        <div style={{ flex: 1 }}>
          <h2
            style={{
              textAlign: "center",
              fontSize: "1.5rem",
              marginBottom: "10px",
            }}
          >
            Top Demand Products
          </h2>
          <table style={{ ...tableStyle, width: "100%" }}>
            <thead>
              <tr>
                <th style={thStyle}>SKU</th>
                <th
                  style={{ ...thStyle, cursor: "pointer", userSelect: "none" }}
                  onClick={() =>
                    setTopSortOrder(topSortOrder === "asc" ? "desc" : "asc")
                  }
                >
                  Predicted Demand {topSortOrder === "asc" ? "▲" : "▼"}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTopProducts.map((item, index) => (
                <tr
                  key={index}
                  style={{
                    backgroundColor:
                      index % 2 === 0
                        ? "rgba(255,255,255,0.08)"
                        : "transparent",
                  }}
                >
                  <td style={tdStyle}>{item.SKU_ID}</td>
                  <td style={tdStyle}>{item.Predicted_Demand.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* LOW PRODUCTS SECTION */}
        <div style={{ flex: 1 }}>
          <h2
            style={{
              textAlign: "center",
              fontSize: "1.5rem",
              marginBottom: "10px",
            }}
          >
            Low Demand Products
          </h2>
          <table style={{ ...tableStyle, width: "100%" }}>
            <thead>
              <tr>
                <th style={thStyle}>SKU</th>
                <th
                  style={{ ...thStyle, cursor: "pointer", userSelect: "none" }}
                  onClick={() =>
                    setLowSortOrder(lowSortOrder === "asc" ? "desc" : "asc")
                  }
                >
                  Predicted Demand {lowSortOrder === "asc" ? "▲" : "▼"}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedLowProducts.map((item, index) => (
                <tr
                  key={index}
                  style={{
                    backgroundColor:
                      index % 2 === 0
                        ? "rgba(255,255,255,0.08)"
                        : "transparent",
                  }}
                >
                  <td style={tdStyle}>{item.SKU_ID}</td>
                  <td style={tdStyle}>{item.Predicted_Demand.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DEMAND TREND */}
      <h2 style={{ marginTop: "40px" }}>Demand Forecast Trend</h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="demand"
            stroke="#8884d8"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* DEMAND DISTRIBUTION */}
      <h2 style={{ marginTop: "40px" }}>Demand Distribution</h2>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={distributionData.slice(0, 50)}>
          <XAxis dataKey="range" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>

      {/* FORECAST SUMMARY */}
      <h2 style={{ marginTop: "40px" }}>Forecast Summary</h2>

      <div style={summaryStyle}>
        <p>• {aboveAveragePercent}% of products have demand above average.</p>
        <p>• {highDemandCount} products predicted to have high demand.</p>
        <p>• {lowDemandCount} products predicted to have low demand.</p>
      </div>

      {/* MANAGER INSIGHTS */}
      <h2 style={{ marginTop: "40px" }}>Manager Insights</h2>

      {data.insights.map((item, index) => (
        <div key={index} style={insightStyle}>
          <h4>{item.SKU_ID}</h4>
          <p style={{ whiteSpace: "pre-line" }}>{item.Manager_Explanation}</p>
        </div>
      ))}
    </div>
  );
};

const cardStyle = {
  background: "#5c5241",
  padding: "20px",
  borderRadius: "10px",
  width: "220px",
  textAlign: "center",
  boxShadow: "0px 2px 5px rgba(0,0,0,0.2)",
};

const tableStyle = {
  width: "50%",
  margin: "10px auto",
  borderCollapse: "collapse",
  textAlign: "center",
  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
};

const thTdStyle = {
  padding: "10px 15px",
  borderBottom: "1px solid #000000",
  fontWeight: 600,
};

const thStyle = {
  ...thTdStyle,
  backgroundColor: "#030303", // you can keep this for header only
};

const tdStyle = {
  ...thTdStyle,
  color: "white", // This ensures you can see the text on the dark background
};

const insightStyle = {
  background: "#3c5e55",
  padding: "15px",
  borderRadius: "8px",
  marginTop: "10px",
  border: "1px solid #ddd",
};

const alertHighStyle = {
  background: "#5e3c3c",
  padding: "15px",
  borderRadius: "8px",
  width: "300px",
  border: "1px solid #ff6b6b",
};

const alertLowStyle = {
  background: "#3c4a5e",
  padding: "15px",
  borderRadius: "8px",
  width: "300px",
  border: "1px solid #4dabf7",
};

const summaryStyle = {
  background: "#4a4f5a",
  padding: "20px",
  borderRadius: "10px",
  marginTop: "10px",
  width: "60%",
  lineHeight: "1.8",
  fontSize: "16px",
};

const downloadBtnStyle = {
  padding: "10px 20px",
  background: "#3c5e55",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  marginTop: "10px",
  fontWeight: "bold",
};
export default TransformerDashboard;
