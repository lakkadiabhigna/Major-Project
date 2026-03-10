// import React, { useEffect, useState } from "react";
// import {
//   BarChart,
//   Bar,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
// } from "recharts";

// import jsPDF from "jspdf";
// import html2canvas from "html2canvas";

// const downloadPDF = () => {
//   const input = document.getElementById("dashboard-report");

//   html2canvas(input).then((canvas) => {
//     const imgData = canvas.toDataURL("image/png");

//     const pdf = new jsPDF("p", "mm", "a4");

//     const pageWidth = pdf.internal.pageSize.getWidth();

//     // Report Title
//     pdf.setFontSize(18);
//     pdf.text("Demand Forecast Analysis Report", pageWidth / 2, 15, {
//       align: "center",
//     });

//     // Generated Date
//     pdf.setFontSize(11);
//     pdf.text(
//       `Generated on: ${new Date().toLocaleDateString()}`,
//       pageWidth / 2,
//       22,
//       { align: "center" },
//     );

//     const imgWidth = 190;
//     const imgHeight = (canvas.height * imgWidth) / canvas.width;

//     // Dashboard Image
//     pdf.addImage(imgData, "PNG", 10, 30, imgWidth, imgHeight);

//     pdf.save("Demand_Forecast_Report.pdf");
//   });
// };
// export default function Dashboard() {
//   const [analysis, setAnalysis] = useState(null);

//   useEffect(() => {
//     const saved = localStorage.getItem("forecast_analysis");
//     if (saved) {
//       setAnalysis(JSON.parse(saved));
//     }
//   }, []);

//   const modelType = analysis?.model_type || "lstm";

//   if (!analysis) {
//     return (
//       <div style={{ padding: 40, textAlign: "center" }}>
//         <h2>No Analysis Available</h2>
//         <p>Please upload a dataset to generate the dashboard.</p>
//       </div>
//     );
//   }
//   const chartData = analysis.top_products.map((p) => ({
//     sku: p.SKU_ID,
//     demand: p.Forecasted_Demand,
//   }));

//   const demandDistribution = [
//     { range: "0-50", count: 0 },
//     { range: "50-100", count: 0 },
//     { range: "100-200", count: 0 },
//     { range: "200+", count: 0 },
//   ];

//   analysis?.top_products?.forEach((p) => {
//     const d = p.Forecasted_Demand;

//     if (d <= 50) demandDistribution[0].count++;
//     else if (d <= 100) demandDistribution[1].count++;
//     else if (d <= 200) demandDistribution[2].count++;
//     else demandDistribution[3].count++;
//   });

//   const trendData =
//     analysis?.top_products?.map((p, i) => ({
//       week: `Week ${i + 1}`,
//       demand: p.Forecasted_Demand,
//     })) || [];
//   return (
//     <div className="page">
//       <h2 className="sectionHeading" style={{ marginBottom: 10 }}>
//         Forecast Analysis
//       </h2>

//       <div style={{ marginBottom: 20, opacity: 0.8 }}>
//         Model Used: <b>{modelType.toUpperCase()}</b>
//       </div>
//       <button
//         onClick={downloadPDF}
//         style={{
//           padding: "10px 16px",
//           background: "#4CAF50",
//           color: "white",
//           border: "none",
//           borderRadius: "8px",
//           cursor: "pointer",
//           marginBottom: "20px",
//         }}
//       >
//         Download Analysis Report (PDF)
//       </button>
//       <div id="dashboard-report">
//         {/* SUMMARY CARDS */}
//         <div className="aboutCard" style={{ marginTop: 20 }}>
//           <div className="aboutTitle">Summary Insights</div>

//           <div className="kpiGrid" style={{ marginTop: 15 }}>
//             <KPI label="Total Products" value={analysis.total_products} />
//             <KPI
//               label="Average Demand"
//               value={analysis.avg_demand.toFixed(2)}
//             />
//             <KPI label="Top SKUs" value={analysis.top_products.length} />
//             <KPI label="Low Demand SKUs" value={analysis.low_products.length} />
//           </div>
//         </div>

//         {/* ALERT SECTION */}

//         <div className="aboutCard" style={{ marginBottom: 20 }}>
//           <div className="aboutTitle">Smart Alerts</div>

//           {analysis.alerts.map((alert, i) => (
//             <div
//               key={i}
//               style={{
//                 padding: 12,
//                 marginTop: 10,
//                 borderRadius: 10,
//                 background:
//                   alert.type === "high"
//                     ? "rgba(255,80,80,0.15)"
//                     : "rgba(255,200,80,0.15)",
//                 border: "1px solid rgba(255,255,255,0.1)",
//               }}
//             >
//               {alert.message}
//             </div>
//           ))}
//         </div>

//         {/* DEMAND VISUALIZATION */}
//         <div
//           className="aboutCard"
//           style={{
//             marginTop: 20,
//             padding: 20,
//           }}
//         >
//           <div className="aboutTitle">Demand Visualization</div>

//           <div style={{ width: "100%", height: 320 }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart data={chartData}>
//                 <XAxis dataKey="sku" />
//                 <YAxis />
//                 <Tooltip />
//                 <Bar dataKey="demand" fill="#4CAF50" radius={[6, 6, 0, 0]} />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* DEMAND TREND */}
//         <div
//           className="aboutCard"
//           style={{
//             marginTop: 20,
//             padding: 20,
//           }}
//         >
//           <div className="aboutTitle">Demand Trend</div>

//           <div style={{ width: "100%", height: 320 }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={trendData}>
//                 <XAxis dataKey="week" />
//                 <YAxis />
//                 <Tooltip />
//                 <Line
//                   type="monotone"
//                   dataKey="demand"
//                   stroke="#4CAF50"
//                   strokeWidth={3}
//                 />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* DEMAND DISTRIBUTION HISTOGRAM */}
//         <div
//           className="aboutCard"
//           style={{
//             marginTop: 20,
//             padding: 20,
//           }}
//         >
//           <div className="aboutTitle">Demand Distribution</div>

//           <div style={{ width: "100%", height: 320 }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart data={demandDistribution}>
//                 <XAxis dataKey="range" />
//                 <YAxis />
//                 <Tooltip />
//                 <Bar dataKey="count" fill="#8884d8" radius={[6, 6, 0, 0]} />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "1fr 1fr",
//             gap: 20,
//             marginTop: 20,
//           }}
//         >
//           {/* TOP PRODUCTS */}
//           <div className="aboutCard">
//             <div className="aboutTitle">Top Demand Products</div>

//             <table style={tableStyle}>
//               <thead>
//                 <tr>
//                   <th style={thStyle}>SKU</th>
//                   <th style={thStyle}>Demand</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {analysis.top_products.map((p, i) => (
//                   <tr key={i}>
//                     <td style={tdStyle}>{p.SKU_ID}</td>
//                     <td style={tdStyle}>{p.Forecasted_Demand}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           {/* LOW PRODUCTS */}
//           <div className="aboutCard">
//             <div className="aboutTitle">Low Demand Products</div>

//             <table style={tableStyle}>
//               <thead>
//                 <tr>
//                   <th style={thStyle}>SKU</th>
//                   <th style={thStyle}>Demand</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {analysis.low_products.map((p, i) => (
//                   <tr key={i}>
//                     <td style={tdStyle}>{p.SKU_ID}</td>
//                     <td style={tdStyle}>{p.Forecasted_Demand}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           {/* AI INSIGHTS */}
//           <div className="aboutCard" style={{ marginTop: 20 }}>
//             <div className="aboutTitle">AI Business Insights</div>

//             <div style={{ marginTop: 15 }}>
//               {analysis.insights.map((item, i) => (
//                 <div
//                   key={i}
//                   style={{
//                     padding: 14,
//                     marginBottom: 12,
//                     borderRadius: 12,
//                     background: "rgba(255,255,255,0.04)",
//                     border: "1px solid rgba(255,255,255,0.1)",
//                   }}
//                 >
//                   <div style={{ marginTop: 6, fontWeight: 700 }}>
//                     Manager Action
//                   </div>
//                   <div style={{ opacity: 0.8 }}>{item.Manager_Explanation}</div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function KPI({ label, value }) {
//   return (
//     <div
//       className="kpi"
//       style={{
//         padding: 20,
//         borderRadius: 16,
//         background: "rgba(255,255,255,0.05)",
//         border: "1px solid rgba(255,255,255,0.12)",
//         backdropFilter: "blur(8px)",
//         textAlign: "center",
//       }}
//     >
//       <div className="kpiLabel" style={{ fontSize: 12 }}>
//         {label}
//       </div>

//       <div
//         className="kpiValue"
//         style={{
//           fontSize: 26,
//           fontWeight: 700,
//           marginTop: 6,
//         }}
//       >
//         {value}
//       </div>
//     </div>
//   );
// }

// const tableStyle = {
//   width: "100%",
//   borderCollapse: "separate",
//   borderSpacing: 0,
//   border: "1px solid rgba(255,255,255,0.12)",
//   borderRadius: 14,
//   overflow: "hidden",
// };

// const thStyle = {
//   textAlign: "left",
//   padding: "12px",
//   fontSize: 12,
//   color: "rgba(255,255,255,0.65)",
//   background: "rgba(255,255,255,0.04)",
// };

// const tdStyle = {
//   padding: "12px",
//   borderBottom: "1px solid rgba(255,255,255,0.08)",
//   color: "rgba(255,255,255,0.85)",
// };
import React, { useEffect, useState } from "react";
import LSTMDashboard from "./LSTMDashboard";
import TransformerDashboard from "./TransformerDashboard";

export default function Dashboard() {
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("forecast_analysis");
    if (saved) {
      setAnalysis(JSON.parse(saved));
    }
  }, []);

  if (!analysis) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>No Analysis Available</h2>
        <p>Please upload a dataset to generate the dashboard.</p>
      </div>
    );
  }

  const modelType = analysis.model_type || "lstm";

  if (modelType === "transformer") {
    return <TransformerDashboard analysis={analysis} />;
  }

  return <LSTMDashboard analysis={analysis} />;
}