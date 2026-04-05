import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/* ===================== STYLES ===================== */
const reportStyles = {
  card: { background: "#0f172a", borderRadius: "12px", padding: "24px", color: "#e5e7eb", marginTop: "20px" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  th: { background: "#1e293b", padding: "12px", textAlign: "left", color: "#cbd5f5", borderBottom: "2px solid #334155" },
  td: { padding: "12px", borderBottom: "1px solid #1e293b" },
  button: { padding: "8px 16px", borderRadius: "6px", border: "none", background: "#3b82f6", color: "#fff", cursor: "pointer", fontWeight: "600" },
  explainBox: { marginTop: "20px", padding: "20px", background: "#020617", borderRadius: "10px", border: "1px solid #1e293b" },
  explainCard: { background: "#0f172a", padding: "15px", borderRadius: "8px", marginBottom: "12px", borderLeft: "4px solid #3b82f6" },
  label: { fontSize: "12px", fontWeight: "700", color: "#38bdf8", marginBottom: "5px", textTransform: "uppercase" },
  text: { fontSize: "14px", lineHeight: "1.6", color: "#cbd5e1" }
};

export default function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [fileErr, setFileErr] = useState("");
  const [validated, setValidated] = useState(false);
  const [baseDate, setBaseDate] = useState("");
  const [status, setStatus] = useState("Idle");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [csvData, setCsvData] = useState("");
  const [selected, setSelected] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [modelType, setModelType] = useState("");

  useEffect(() => {
    localStorage.removeItem("forecast_analysis");
  }, []);

  const onPickFile = (e) => {
    setFileErr(""); setValidated(false); setStatus("Idle");
    setProgress(0); setResults([]); setCsvData("");
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const runProcess = async () => {
    setStatus("Processing"); setProgress(40);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (baseDate) formData.append("base_date", baseDate);

      const response = await fetch("http://localhost:8000/forecast", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      console.log("BACKEND:", data);

      if (data.status === "success") {
        const finalData = data.data || data.results || [];
        setResults(finalData);
        setCsvData(data.csv);
        setAnalysisData({ ...data.analysis, model_type: data.model_type });
        setModelType(data.model_type?.toLowerCase()); // FIX
        setStatus("Completed"); setProgress(100);
      }
    } catch {
      setStatus("Failed"); setFileErr("Processing failed.");
    }
  };

  const downloadCsv = () => {
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "forecast_results.csv";
    a.click();
  };

  return (
    <div className="page" style={{ padding: "20px", backgroundColor: "#020617", minHeight: "100vh" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2 style={{ color: "#fff" }}>Upload CSV</h2>
        <button onClick={() => navigate("/instructions")} style={reportStyles.button}>📘 Instructions</button>
      </div>

      {/* UPLOAD */}
      <div className="aboutCard" style={{ background: "#0f172a", padding: "20px", borderRadius: "12px", maxWidth: "1000px", margin: "0 auto" }}>
        <input type="file" onChange={onPickFile} style={{ color: "#fff" }} />

        <div style={{ marginTop: "15px" }}>
          <label style={{ color: "#94a3b8" }}>Base Forecast Date: </label>
          <input type="date" value={baseDate} onChange={(e) => setBaseDate(e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button onClick={() => { setValidated(true); setStatus("Ready"); }} disabled={!file} style={reportStyles.button}>Validate CSV</button>
          <button onClick={runProcess} disabled={!validated} style={{ ...reportStyles.button, background: "#22c55e" }}>Run</button>

          {results.length > 0 && (
            <button onClick={downloadCsv} style={{ ...reportStyles.button, background: "#64748b" }}>Download Results</button>
          )}

          {analysisData && (
            <button
              onClick={() => {
                localStorage.setItem("forecast_analysis", JSON.stringify(analysisData));
                navigate(modelType === "transformer" ? "/transformer-dashboard" : "/dashboard");
              }}
              style={{ ...reportStyles.button, background: "#8b5cf6" }}
            >
              View Analysis
            </button>
          )}
        </div>

        <div style={{ marginTop: "15px", color: "#94a3b8" }}>
          Status: <b>{status}</b> | Progress: <b>{progress}%</b>
        </div>
      </div>

      {/* TABLE */}
      {results.length > 0 && (
        <div style={reportStyles.card}>
          <h3>Forecast Results</h3>

          <table style={reportStyles.table}>
            <thead>
              <tr>
                <th style={reportStyles.th}>SKU_ID</th>
                <th style={reportStyles.th}>Nearby_Festival</th>
                <th style={reportStyles.th}>Forecasted_Demand</th>
                {modelType === "transformer" && <th style={reportStyles.th}>Predicted_Demand</th>}
                <th style={reportStyles.th}>EOQ</th>
                <th style={reportStyles.th}>ROP</th>
                <th style={reportStyles.th}>Lead_Time</th>
                <th style={reportStyles.th}>Details</th>
              </tr>
            </thead>

            <tbody>
              {results.map((row, i) => (
                <tr key={i}>
                  <td style={reportStyles.td}>{row.SKU_ID}</td>
                  <td style={reportStyles.td}>{row.Nearby_Festival || "N/A"}</td>
                  <td style={reportStyles.td}>{row.Forecasted_Demand}</td>

                  {modelType === "transformer" && (
                    <td style={reportStyles.td}>{row.Predicted_Demand}</td>
                  )}

                  <td style={reportStyles.td}>{row.EOQ}</td>
                  <td style={reportStyles.td}>{row.ROP}</td>
                  <td style={reportStyles.td}>{row.Lead_Time}</td>

                  <td style={reportStyles.td}>
                    <button style={reportStyles.button} onClick={() => setSelected(row)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* DETAILS */}
          {selected && (
            <div style={reportStyles.explainBox}>
              <h3>Info for {selected.SKU_ID}</h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
                <div style={reportStyles.explainCard}>
                  <div style={reportStyles.label}>Spike_Detected</div>
                  <div style={reportStyles.text}>{String(selected.Spike_Detected)}</div>
                </div>

                <div style={reportStyles.explainCard}>
                  <div style={reportStyles.label}>Spike_Days</div>
                  <div style={reportStyles.text}>{selected.Spike_Days}</div>
                </div>

                <div style={reportStyles.explainCard}>
                  <div style={reportStyles.label}>Max_Spike_Multiplier</div>
                  <div style={reportStyles.text}>{selected.Max_Spike_Multiplier}</div>
                </div>
              </div>

              <div style={reportStyles.explainCard}>
                <div style={reportStyles.label}>Festival_Spike_Link</div>
                <div style={reportStyles.text}>{selected.Festival_Spike_Link}</div>
              </div>

              <div style={reportStyles.explainCard}>
                <div style={reportStyles.label}>Demand_Explanation</div>
                <div style={reportStyles.text}>{selected.Demand_Explanation}</div>
              </div>

              <div style={reportStyles.explainCard}>
                <div style={reportStyles.label}>Inventory_Explanation</div>
                <div style={reportStyles.text}>{selected.Inventory_Explanation}</div>
              </div>

              <div style={reportStyles.explainCard}>
                <div style={reportStyles.label}>Spike_Explanation</div>
                <div style={reportStyles.text}>{selected.Spike_Explanation}</div>
              </div>

              {/* NOW SHOWN FOR BOTH */}
              <div style={reportStyles.explainCard}>
                <div style={reportStyles.label}>Manager_Explanation</div>
                <div style={reportStyles.text}>{selected.Manager_Explanation || "N/A"}</div>
              </div>

              <button style={{ ...reportStyles.button, background: "#ef4444", marginTop: "10px" }} onClick={() => setSelected(null)}>
                Close Info
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}