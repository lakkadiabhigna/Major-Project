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

  const input10 = useMemo(() => inputParsed.data.slice(0, 10), [inputParsed.data]);
  const output10 = useMemo(() => outputParsed.data.slice(0, 10), [outputParsed.data]);

  // KPI helpers
  const totalInputRows = inputParsed.data.length;
  const totalOutputRows = outputParsed.data.length;

  // Your known columns (from your file)
  const hasExplainCols = useMemo(() => {
    const cols = outputParsed.headers;
    return (
      cols.includes("Demand_Explanation") ||
      cols.includes("Inventory_Explanation") ||
      cols.includes("Manager_Explanation")
    );
  }, [outputParsed.headers]);

  return (
    <section className="page">
      <div className="pageHeader">
        <h2 className="sectionHeading" style={{ marginTop: 0 }}>
          Demo Report
        </h2>
        <p className="subtext" style={{ whiteSpace: "normal" }}>
          A small preview of OptiMind’s pipeline — sample input rows and the final manager-ready output.
          (Preview only — no downloads.)
        </p>
      </div>

      {/* KPIs */}
      <div className="kpiGrid" style={{ marginBottom: 18 }}>
        <div className="kpi">
          <div className="kpiLabel">Input rows available</div>
          <div className="kpiValue">{totalInputRows}</div>
        </div>
        <div className="kpi">
          <div className="kpiLabel">Output rows available</div>
          <div className="kpiValue">{totalOutputRows}</div>
        </div>
        <div className="kpi">
          <div className="kpiLabel">Preview rows shown</div>
          <div className="kpiValue">10 + 10</div>
        </div>
        <div className="kpi">
          <div className="kpiLabel">Explainability</div>
          <div className="kpiValue">{hasExplainCols ? "Included" : "—"}</div>
        </div>
      </div>

      {/* Two tables */}
      <div className="demoGrid">
        {/* INPUT */}
        <div className="tableCard">
          <div className="tableCardHeader">
            <div>
              <div className="tableTitle">Input (sample 10 rows)</div>
              <div className="tableHint">Columns: Date, SKU_ID, Units_Sold</div>
            </div>
            <span className="pill">Raw input preview</span>
          </div>

          <div className="tableWrap">
            <table className="dataTable">
              <thead>
                <tr>
                  {inputParsed.headers.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {input10.map((r, idx) => (
                  <tr key={idx}>
                    {inputParsed.headers.map((h) => (
                      <td key={h}>{r[h]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* OUTPUT */}
        <div className="tableCard">
          <div className="tableCardHeader">
            <div>
              <div className="tableTitle">Output (final 10 rows)</div>
              <div className="tableHint">Click any row to read the explanations clearly.</div>
            </div>
            <span className="pill pillGreen">Manager-ready</span>
          </div>

          <div className="tableWrap">
            <table className="dataTable">
              <thead>
                <tr>
                  {outputParsed.headers
                    .filter(
                      (h) =>
                        h !== "Demand_Explanation" &&
                        h !== "Inventory_Explanation" &&
                        h !== "Manager_Explanation"
                    )
                    .map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {output10.map((r, idx) => (
                  <tr key={idx} className="rowClickable" onClick={() => setSelected(r)}>
                    {outputParsed.headers
                      .filter(
                        (h) =>
                          h !== "Demand_Explanation" &&
                          h !== "Inventory_Explanation" &&
                          h !== "Manager_Explanation"
                      )
                      .map((h) => (
                        <td key={h}>{r[h]}</td>
                      ))}
                    <td>
                      <button className="miniBtn" type="button" onClick={(e) => { e.stopPropagation(); setSelected(r); }}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Explanation panel */}
          <div className="explainBox">
            {!selected ? (
              <div className="explainEmpty">
                Select a row to view <b>Demand</b>, <b>Inventory</b>, and <b>Manager</b> explanations.
              </div>
            ) : (
              <>
                <div className="explainHeader">
                  <div className="explainTitle">
                    Explanations for SKU: <span className="mono">{selected.SKU_ID}</span>
                  </div>
                  <button className="miniBtn" type="button" onClick={() => setSelected(null)}>
                    Close
                  </button>
                </div>

                <div className="explainGrid">
                  <div className="explainCard">
                    <div className="explainLabel">Demand Explanation</div>
                    <div className="explainText">{selected.Demand_Explanation || "—"}</div>
                  </div>

                  <div className="explainCard">
                    <div className="explainLabel">Inventory Explanation</div>
                    <div className="explainText">{selected.Inventory_Explanation || "—"}</div>
                  </div>

                  <div className="explainCard">
                    <div className="explainLabel">Manager Explanation</div>
                    <div className="explainText">{selected.Manager_Explanation || "—"}</div>
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