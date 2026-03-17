import React, { useMemo, useState } from "react";

import inputCsv from "../assets/today-testing.csv?raw";
import outputCsv from "../assets/forecast_results (9).csv?raw";

/* ===================== STYLES ===================== */
const styles = {
  page: {
    padding: "24px",
    color: "#e5e7eb",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
  },

  card: {
    background: "#0f172a",
    borderRadius: "12px",
    padding: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
  },

  title: {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "12px",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },

  th: {
    background: "#1e293b",
    padding: "10px",
    textAlign: "left",
  },

  td: {
    padding: "10px",
    borderBottom: "1px solid #1e293b",
  },

  rowHover: {
    cursor: "pointer",
  },

  explainBox: {
    marginTop: "16px",
    padding: "16px",
    background: "#020617",
    borderRadius: "10px",
  },

  explainCard: {
    background: "#0f172a",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "10px",
  },

  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#38bdf8",
    marginBottom: "6px",
  },

  text: {
    fontSize: "13px",
    lineHeight: "1.5",
    color: "#cbd5f5",
  },

  button: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    background: "#3b82f6",
    color: "#fff",
    cursor: "pointer",
    fontSize: "12px",
  },
};

/* ===================== CSV PARSER ===================== */
function parseCSV(text) {
  if (!text) return { headers: [], data: [] };

  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      row.push(cell.trim());
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cell.trim());
      cell = "";
      if (row.some((item) => String(item).trim() !== "")) rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some((item) => String(item).trim() !== "")) rows.push(row);
  }

  const headers = rows[0] || [];
  const data = rows.slice(1).map((cols) => {
    const obj = {};
    headers.forEach((h, idx) => (obj[h] = cols[idx] ?? ""));
    return obj;
  });

  return { headers, data };
}

/* ===================== HELPERS ===================== */
const cleanText = (text) =>
  String(text || "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();

const getSkuNumber = (sku) => Number(String(sku || "").match(/\d+/)?.[0] || 0);

function extractSection(fullText, startLabel, nextLabels = []) {
  if (!fullText) return "";

  const escapedStart = startLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedNext = nextLabels
    .map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  const regex = new RegExp(
    `${escapedStart}\\s*([\\s\\S]*?)(?=${escapedNext}|$)`,
    "i",
  );

  return cleanText(fullText.match(regex)?.[1] || "");
}

/* ===================== DATA BUILDERS ===================== */
function buildInputRows(rows) {
  const map = new Map();
  rows.forEach((r) => {
    const sku = cleanText(r.SKU_ID);
    if (sku && !map.has(sku)) map.set(sku, r);
  });
  return Array.from(map.values()).sort(
    (a, b) => getSkuNumber(a.SKU_ID) - getSkuNumber(b.SKU_ID),
  );
}

function buildOutputRows(rows) {
  return rows
    .filter((r) => cleanText(r.SKU_ID))
    .map((row) => {
      const combined = [
        row.Demand_Explanation,
        row.Inventory_Explanation,
        row.Spike_Explanation,
        row.Manager_Explanation,
      ]
        .filter(Boolean)
        .join(" ");

      return {
        ...row,
        Momentum_Insight:
          extractSection(combined, "Momentum Insight", [
            "Inventory Insight",
            "Spike Insight",
            "Manager Action",
          ]) || cleanText(row.Demand_Explanation),

        Inventory_Insight:
          extractSection(combined, "Inventory Insight", [
            "Spike Insight",
            "Manager Action",
          ]) || cleanText(row.Inventory_Explanation),

        Spike_Insight:
          extractSection(combined, "Spike Insight", ["Manager Action"]) ||
          cleanText(row.Spike_Explanation),

        Manager_Action:
          extractSection(combined, "Manager Action") ||
          cleanText(row.Manager_Explanation),
      };
    })
    .sort((a, b) => getSkuNumber(a.SKU_ID) - getSkuNumber(b.SKU_ID));
}

/* ===================== MAIN COMPONENT ===================== */
export default function DemoReport() {
  const [selected, setSelected] = useState(null);

  const inputParsed = useMemo(() => parseCSV(inputCsv), []);
  const outputParsed = useMemo(() => parseCSV(outputCsv), []);

  const input10 = useMemo(
    () => buildInputRows(inputParsed.data).slice(0, 10),
    [inputParsed.data],
  );

  const output10 = useMemo(
    () => buildOutputRows(outputParsed.data).slice(0, 10),
    [outputParsed.data],
  );

  return (
    <section style={styles.page}>
      <h2 style={{ marginBottom: 20 }}>Demo Report</h2>

      <div style={styles.grid}>
        {/* INPUT */}
        <div style={styles.card}>
          <div style={styles.title}>Input Preview</div>

          <table style={styles.table}>
            <thead>
              <tr>
                {inputParsed.headers.map((h) => (
                  <th key={h} style={styles.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {input10.map((row, i) => (
                <tr key={i}>
                  {inputParsed.headers.map((h) => (
                    <td key={h} style={styles.td}>
                      {row[h]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* OUTPUT */}
        <div style={styles.card}>
          <div style={styles.title}>Output Preview</div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>SKU_ID</th>
                <th style={styles.th}>Forecast</th>
                <th style={styles.th}>EOQ</th>
                <th style={styles.th}>ROP</th>
                <th style={styles.th}>Lead</th>
                <th style={styles.th}>Spike</th>
                <th style={styles.th}>Details</th>
              </tr>
            </thead>

            <tbody>
              {output10.map((row, i) => (
                <tr
                  key={i}
                  style={styles.rowHover}
                  onClick={() => setSelected(row)}
                >
                  <td style={styles.td}>{row.SKU_ID}</td>
                  <td style={styles.td}>{row.Forecasted_Demand}</td>
                  <td style={styles.td}>{row.EOQ}</td>
                  <td style={styles.td}>{row.ROP}</td>
                  <td style={styles.td}>{row.Lead_Time}</td>

                  {/* ✅ SPIKE COLOR FIX */}
                  <td
                    style={{
                      ...styles.td,
                      color:
                        row.Spike_Detected === "True" ? "#ef4444" : "#22c55e",
                      fontWeight: "600",
                    }}
                  >
                    {row.Spike_Detected}
                  </td>

                  <td style={styles.td}>
                    <button
                      style={styles.button}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(row);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* INSIGHTS */}
          <div style={styles.explainBox}>
            {!selected ? (
              <div style={{ textAlign: "center", color: "#94a3b8" }}>
                Select a row to view insights
              </div>
            ) : (
              <>
                <h3 style={{ marginBottom: 10 }}>{selected.SKU_ID}</h3>

                <div style={styles.explainCard}>
                  <div style={styles.label}>Momentum Insight</div>
                  <div style={styles.text}>{selected.Momentum_Insight}</div>
                </div>

                <div style={styles.explainCard}>
                  <div style={styles.label}>Inventory Insight</div>
                  <div style={styles.text}>{selected.Inventory_Insight}</div>
                </div>

                <div style={styles.explainCard}>
                  <div style={styles.label}>Spike Insight</div>
                  <div style={styles.text}>{selected.Spike_Insight}</div>
                </div>

                <div style={styles.explainCard}>
                  <div style={styles.label}>Manager Action</div>
                  <div style={styles.text}>{selected.Manager_Action}</div>
                </div>

                <button
                  style={{ ...styles.button, marginTop: 10 }}
                  onClick={() => setSelected(null)}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
