import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [kpis, setKpis] = useState({
    totalSkus: 0,
    skuNeedingRestock: 0,
    skuOverstockRisk: 0,
    serviceLevel: 0,
  });

  const [status, setStatus] = useState("Idle");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("opt_run_history");
    if (saved) setHistory(JSON.parse(saved));

    const latest = localStorage.getItem("opt_latest_kpis");
    if (latest) setKpis(JSON.parse(latest));

    const savedStatus = localStorage.getItem("opt_latest_status");
    if (savedStatus) setStatus(savedStatus);

    const savedProgress = localStorage.getItem("opt_latest_progress");
    if (savedProgress) setProgress(Number(savedProgress));
  }, []);

  return (
    <div className="page">
      <h2 className="sectionHeading">Dashboard</h2>
      <p className="subtext" style={{ whiteSpace: "normal" }}>
        View run status, KPIs and history. Use the Upload page to upload CSV and generate results.
      </p>

      {/* Processing Status */}
      <div className="aboutCard" style={{ marginTop: 14 }}>
        <div className="aboutTitle">Processing Status</div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 12 }}>
          <div style={{ flex: "1 1 220px" }}>
            <div className="kpiLabel">Current Status</div>
            <div className="kpiValue" style={{ fontSize: 20 }}>
              {status}
            </div>
          </div>

          <div style={{ flex: "2 1 420px" }}>
            <div className="kpiLabel">Progress</div>
            <div style={progressWrap}>
              <div style={{ ...progressFill, width: `${progress}%` }} />
            </div>
            <div style={{ marginTop: 8, color: "rgba(255,255,255,0.65)" }}>{progress}%</div>
          </div>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="aboutCard" style={{ marginTop: 14 }}>
        <div className="aboutTitle">Summary KPIs</div>

        <div className="kpiGrid" style={{ marginTop: 12 }}>
          <KPI label="Total SKUs processed" value={kpis.totalSkus || "—"} />
          <KPI label="SKUs needing restock" value={kpis.skuNeedingRestock || "—"} />
          <KPI label="Overstock risk SKUs" value={kpis.skuOverstockRisk || "—"} />
          <KPI
            label="Service level (placeholder)"
            value={kpis.serviceLevel ? `${kpis.serviceLevel}%` : "—"}
          />
        </div>
      </div>

      {/* Run History */}
      <div className="aboutCard" style={{ marginTop: 14 }}>
        <div className="aboutTitle">Run History</div>

        {history.length === 0 ? (
          <div style={{ marginTop: 10, color: "rgba(255,255,255,0.7)" }}>
            No runs yet. Go to Upload page and run once to see history here.
          </div>
        ) : (
          <div style={{ marginTop: 12, overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Time</th>
                  <th style={thStyle}>File</th>
                  <th style={thStyle}>Total SKUs</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td style={tdStyle}>{h.time}</td>
                    <td style={tdStyle}>{h.fileName}</td>
                    <td style={tdStyle}>{h.totalSkus}</td>
                    <td style={tdStyle}>{h.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: 12 }}>
              <button
                className="navBtn"
                onClick={() => {
                  localStorage.removeItem("opt_run_history");
                  setHistory([]);
                }}
              >
                Clear History
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KPI({ label, value }) {
  return (
    <div className="kpi">
      <div className="kpiLabel">{label}</div>
      <div className="kpiValue">{value}</div>
    </div>
  );
}

const progressWrap = {
  height: 14,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  overflow: "hidden",
};

const progressFill = {
  height: "100%",
  borderRadius: 999,
  background: "linear-gradient(135deg, rgba(34,197,94,0.95), rgba(124,58,237,0.95))",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  overflow: "hidden",
};

const thStyle = {
  textAlign: "left",
  padding: "12px 12px",
  fontSize: 12,
  color: "rgba(255,255,255,0.65)",
  background: "rgba(255,255,255,0.04)",
  borderBottom: "1px solid rgba(255,255,255,0.10)",
};

const tdStyle = {
  padding: "12px 12px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.85)",
};