import React, { useMemo, useState } from "react";

// ✅ Put these files in: src/assets/
import inputCsv from "../assets/today-testing.csv?raw";
import outputCsv from "../assets/optiMind_output.csv?raw";

/** Small CSV parser (handles quotes reasonably well) */
function parseCSV(text) {
  const rows = [];
  const lines = text.replace(/\r/g, "").split("\n").filter(Boolean);
  if (!lines.length) return { headers: [], data: [] };

  const splitLine = (line) => {
    const out = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      const next = line[i + 1];

      if (ch === '"' && inQuotes && next === '"') {
        cur += '"';
        i++;
        continue;
      }
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === "," && !inQuotes) {
        out.push(cur.trim());
        cur = "";
        continue;
      }
      cur += ch;
    }
    out.push(cur.trim());
    return out;
  };

  const headers = splitLine(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    if (!cols.length) continue;
    const obj = {};
    headers.forEach((h, idx) => (obj[h] = cols[idx] ?? ""));
    rows.push(obj);
  }
  return { headers, data: rows };
}

export default function DemoReport() {
  const [selected, setSelected] = useState(null);

  const inputParsed = useMemo(() => parseCSV(inputCsv), []);
  const outputParsed = useMemo(() => parseCSV(outputCsv), []);

  const input10 = useMemo(
    () => inputParsed.data.slice(0, 10),
    [inputParsed.data],
  );
  const output10 = useMemo(
    () => outputParsed.data.slice(0, 10),
    [outputParsed.data],
  );

  const totalInputRows = inputParsed.data.length;
  const totalOutputRows = outputParsed.data.length;

  const visibleOutputHeaders = useMemo(
    () =>
      outputParsed.headers.filter(
        (h) =>
          h !== "Demand_Explanation" &&
          h !== "Inventory_Explanation" &&
          h !== "Manager_Explanation",
      ),
    [outputParsed.headers],
  );

  const hasExplainCols = useMemo(() => {
    const cols = outputParsed.headers;
    return (
      cols.includes("Demand_Explanation") ||
      cols.includes("Inventory_Explanation") ||
      cols.includes("Manager_Explanation")
    );
  }, [outputParsed.headers]);

  return (
    <section style={styles.page}>
      <div style={styles.headerWrap}>
        <div>
          <div style={styles.badge}>OptiMind Demo Preview</div>
          <h2 style={styles.heading}>Demo Report</h2>
          <p style={styles.subtext}>
            A polished preview of the OptiMind pipeline showing sample input
            rows and final manager-ready output with explainability.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Input Rows</div>
          <div style={styles.kpiValue}>{totalInputRows}</div>
          <div style={styles.kpiNote}>Uploaded source data</div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Output Rows</div>
          <div style={styles.kpiValue}>{totalOutputRows}</div>
          <div style={styles.kpiNote}>Generated recommendations</div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Preview Window</div>
          <div style={styles.kpiValue}>10 + 10</div>
          <div style={styles.kpiNote}>Sample rows shown</div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Explainability</div>
          <div style={styles.kpiValue}>{hasExplainCols ? "Yes" : "No"}</div>
          <div style={styles.kpiNote}>Demand + inventory insights</div>
        </div>
      </div>

      <div style={styles.mainGrid}>
        {/* INPUT CARD */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <div style={styles.cardTitle}>Input Preview</div>
              <div style={styles.cardSubtitle}>
                Sample 10 rows from uploaded demand data
              </div>
            </div>
            <span style={{ ...styles.pill, ...styles.bluePill }}>
              Raw Input
            </span>
          </div>

          <div style={styles.tableWrap}>
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
                {input10.map((r, idx) => (
                  <tr
                    key={idx}
                    style={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}
                  >
                    {inputParsed.headers.map((h) => (
                      <td key={h} style={styles.td}>
                        {r[h]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* OUTPUT CARD */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <div style={styles.cardTitle}>Output Preview</div>
              <div style={styles.cardSubtitle}>
                Final 10 rows of manager-ready output with row-level
                explanations
              </div>
            </div>
            <span style={{ ...styles.pill, ...styles.greenPill }}>
              Smart Output
            </span>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {visibleOutputHeaders.map((h) => (
                    <th key={h} style={styles.th}>
                      {h}
                    </th>
                  ))}
                  <th style={styles.th}>Details</th>
                </tr>
              </thead>
              <tbody>
                {output10.map((r, idx) => {
                  const isSelected = selected === r;
                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelected(r)}
                      style={{
                        ...(idx % 2 === 0 ? styles.rowEven : styles.rowOdd),
                        ...(isSelected ? styles.selectedRow : {}),
                        cursor: "pointer",
                      }}
                    >
                      {visibleOutputHeaders.map((h) => (
                        <td key={h} style={styles.td}>
                          {r[h]}
                        </td>
                      ))}
                      <td style={styles.td}>
                        <button
                          type="button"
                          style={styles.button}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(r);
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Explanation Panel */}
          <div style={styles.explainSection}>
            {!selected ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>ⓘ</div>
                <div style={styles.emptyText}>
                  Select any output row to view the corresponding demand,
                  inventory, and manager explanations.
                </div>
              </div>
            ) : (
              <>
                <div style={styles.explainHeader}>
                  <div>
                    <div style={styles.explainTopLabel}>
                      Selected Recommendation
                    </div>
                    <div style={styles.explainTitle}>
                      SKU:{" "}
                      <span style={styles.mono}>
                        {selected.SKU_ID || "N/A"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    style={{ ...styles.button, ...styles.secondaryButton }}
                    onClick={() => setSelected(null)}
                  >
                    Close
                  </button>
                </div>

                <div style={styles.explainGrid}>
                  <div style={styles.explainCard}>
                    <div style={styles.explainCardLabel}>
                      Demand Explanation
                    </div>
                    <div style={styles.explainCardText}>
                      {selected.Demand_Explanation ||
                        "No demand explanation available."}
                    </div>
                  </div>

                  <div style={styles.explainCard}>
                    <div style={styles.explainCardLabel}>
                      Inventory Explanation
                    </div>
                    <div style={styles.explainCardText}>
                      {selected.Inventory_Explanation ||
                        "No inventory explanation available."}
                    </div>
                  </div>

                  <div style={styles.explainCard}>
                    <div style={styles.explainCardLabel}>
                      Manager Explanation
                    </div>
                    <div style={styles.explainCardText}>
                      {selected.Manager_Explanation ||
                        "No manager explanation available."}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "28px",
    background:
      "linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #334155 100%)",
    color: "#f1f5f9",
  },

  headerWrap: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
  },

  badge: {
    display: "inline-block",
    fontSize: "12px",
    fontWeight: 700,
    color: "#1e40af",
    background: "rgba(255,255,255,0.92)",
    padding: "6px 12px",
    borderRadius: "999px",
    marginBottom: "12px",
    letterSpacing: "0.3px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
  },

  heading: {
    margin: 0,
    fontSize: "32px",
    fontWeight: 800,
    color: "#ffffff",
    textShadow: "0 3px 10px rgba(0,0,0,0.3)",
  },

  subtext: {
    marginTop: "10px",
    maxWidth: "760px",
    fontSize: "15px",
    lineHeight: 1.7,
    color: "#cbd5e1",
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "26px",
  },

  kpiCard: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.18)",
    backdropFilter: "blur(12px)",
  },

  kpiLabel: {
    fontSize: "13px",
    color: "#cbd5e1",
    fontWeight: 600,
    marginBottom: "10px",
  },

  kpiValue: {
    fontSize: "30px",
    fontWeight: 800,
    color: "#ffffff",
    marginBottom: "6px",
  },

  kpiNote: {
    fontSize: "13px",
    color: "#94a3b8",
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
  },

  card: {
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(255,255,255,0.35)",
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 14px 40px rgba(15, 23, 42, 0.18)",
    backdropFilter: "blur(12px)",
    overflow: "hidden",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "14px",
    marginBottom: "16px",
  },

  cardTitle: {
    fontSize: "20px",
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: "4px",
  },

  cardSubtitle: {
    fontSize: "13px",
    color: "#64748b",
    lineHeight: 1.5,
  },

  pill: {
    alignSelf: "flex-start",
    fontSize: "12px",
    fontWeight: 700,
    padding: "7px 12px",
    borderRadius: "999px",
    whiteSpace: "nowrap",
  },

  bluePill: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },

  greenPill: {
    background: "#dcfce7",
    color: "#15803d",
  },

  tableWrap: {
    overflowX: "auto",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    background: "#fff",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "720px",
  },

  th: {
    background: "#f8fafc",
    color: "#334155",
    fontSize: "13px",
    fontWeight: 700,
    textAlign: "left",
    padding: "14px 14px",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 1,
  },

  td: {
    padding: "13px 14px",
    fontSize: "13px",
    color: "#334155",
    borderBottom: "1px solid #edf2f7",
    verticalAlign: "top",
  },

  rowEven: {
    background: "#ffffff",
  },

  rowOdd: {
    background: "#fbfdff",
  },

  selectedRow: {
    background: "#eaf3ff",
    outline: "1px solid #bfdbfe",
  },

  button: {
    border: "none",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#fff",
    padding: "8px 14px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 6px 14px rgba(37, 99, 235, 0.22)",
  },

  secondaryButton: {
    background: "#e2e8f0",
    color: "#1e293b",
    boxShadow: "none",
  },

  explainSection: {
    marginTop: "18px",
    background: "linear-gradient(180deg, #f8fbff 0%, #f1f6fb 100%)",
    border: "1px solid #dbeafe",
    borderRadius: "18px",
    padding: "18px",
  },

  emptyState: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "12px 4px",
  },

  emptyIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontWeight: 800,
    fontSize: "18px",
    flexShrink: 0,
  },

  emptyText: {
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.7,
  },

  explainHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    marginBottom: "16px",
  },

  explainTopLabel: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    marginBottom: "4px",
  },

  explainTitle: {
    fontSize: "20px",
    fontWeight: 800,
    color: "#0f172a",
  },

  mono: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    color: "#2563eb",
  },

  explainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "14px",
  },

  explainCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "16px",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
  },

  explainCardLabel: {
    fontSize: "13px",
    fontWeight: 800,
    color: "#1e293b",
    marginBottom: "8px",
  },

  explainCardText: {
    fontSize: "14px",
    color: "#475569",
    lineHeight: 1.8,
    whiteSpace: "pre-wrap",
  },
};
