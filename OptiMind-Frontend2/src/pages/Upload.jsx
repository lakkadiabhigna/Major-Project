import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Upload() {
  useEffect(() => {
    localStorage.removeItem("forecast_analysis");
  }, []);
  const [file, setFile] = useState(null);
  const [fileErr, setFileErr] = useState("");
  const [validated, setValidated] = useState(false);

  const [status, setStatus] = useState("Idle");
  const [progress, setProgress] = useState(0);

  const [results, setResults] = useState([]);
  const [csvData, setCsvData] = useState(""); // ✅ NEW
  const navigate = useNavigate();

  const canValidate = useMemo(() => !!file, [file]);
  const canRun = useMemo(
    () => validated && status === "Ready",
    [validated, status],
  );

  const [analysisData, setAnalysisData] = useState(null);

  const onPickFile = (e) => {
    setFileErr("");
    setValidated(false);
    setStatus("Idle");
    setProgress(0);
    setResults([]);
    setCsvData(""); // reset csv

    const f = e.target.files?.[0];
    if (!f) return;

    const name = f.name.toLowerCase();

    if (!(name.endsWith(".csv") || name.endsWith(".xlsx"))) {
      setFileErr("Only CSV or Excel (.xlsx) files allowed.");
      return;
    }

    setFile(f);
  };
  

  const validateCsv = async () => {
    if (!file) return;

    const name = file.name.toLowerCase();

    try {
      // If CSV → validate its text content
      if (name.endsWith(".csv")) {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter((x) => x.trim() !== "");

        if (lines.length < 2) {
          setFileErr("CSV must contain header + rows.");
          return;
        }
      }

      // If Excel → skip text validation
      if (name.endsWith(".xlsx")) {
        console.log("Excel file detected — skipping CSV validation.");
      }

      setValidated(true);
      setStatus("Ready");
    } catch {
      setFileErr("Invalid file.");
    }
  };
  // 🚀 REAL BACKEND CALL
  const runProcess = async () => {
    if (!file || !validated) return;

    setStatus("Uploading");
    setProgress(20);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setStatus("Processing");
      setProgress(40);

      const response = await fetch("http://localhost:8000/forecast", {
        method: "POST",
        body: formData,
      });

      setProgress(70);

      const data = await response.json();

      if (data.status !== "success") {
        throw new Error(data.message || "Processing failed");
      }

      setResults(data.data);
      setCsvData(data.csv); // ✅ STORE CSV

      setAnalysisData({
        ...data.analysis,
        model_type: data.model_type,
      });
      setProgress(100);
      setStatus("Completed");
    } catch (err) {
      console.error(err);
      setStatus("Failed");
      setFileErr("Backend processing failed.");
      setProgress(0);
    }
  };

  // ✅ DOWNLOAD FUNCTION
  const downloadCsv = () => {
    if (!csvData) return;

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "forecast_results.csv";
    a.click();

    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <h2 className="sectionHeading" style={{ marginTop: 0 }}>
        Upload CSV
      </h2>

      <div
        className="aboutCard"
        style={{ maxWidth: 950, margin: "18px auto", textAlign: "left" }}
      >
        <div className="aboutTitle">Upload & Process</div>

        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={onPickFile}
          style={{ width: "100%", marginTop: 12 }}
        />

        {file && (
          <div style={{ marginTop: 10 }}>
            Selected: <b>{file.name}</b>
          </div>
        )}

        {fileErr && (
          <div style={{ marginTop: 12, color: "#ffb4b4", fontWeight: 700 }}>
            {fileErr}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button disabled={!canValidate} onClick={validateCsv}>
            Validate CSV
          </button>

          <button disabled={!canRun} onClick={runProcess}>
            Run
          </button>

          {/* ✅ DOWNLOAD BUTTON */}
          {results.length > 0 && (
            <button onClick={downloadCsv}>Download Results</button>
          )}

          {analysisData && (
            <button
              onClick={() => {
                localStorage.setItem(
                  "forecast_analysis",
                  JSON.stringify(analysisData),
                );

                if (analysisData.model_type === "transformer") {
                  navigate("/transformer-dashboard");
                } else {
                  navigate("/dashboard");
                }
              }}
            >
              View Analysis
            </button>
          )}
        </div>

        <div style={{ marginTop: 14 }}>
          Status: <b>{status}</b> | Progress: <b>{progress}%</b>
        </div>
      </div>

      {/* 🔥 DISPLAY RESULTS */}
      {results.length > 0 && (
        <div
          className="aboutCard"
          style={{ maxWidth: 1200, margin: "20px auto" }}
        >
          <h3>Forecast Results</h3>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {Object.keys(results[0]).map((key) => (
                    <th
                      key={key}
                      style={{ borderBottom: "1px solid #ccc", padding: 8 }}
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j} style={{ padding: 8 }}>
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
