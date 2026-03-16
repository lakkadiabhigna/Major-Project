import React from "react";
import { useNavigate } from "react-router-dom";

export default function Instructions() {
  const navigate = useNavigate();

  const pageStyle = {
    maxWidth: "1000px",
    margin: "40px auto",
    padding: "20px",
    color: "#e5e7eb"
  };

  const sectionStyle = {
    background: "#1f2937",
    padding: "25px",
    borderRadius: "10px",
    marginBottom: "25px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.4)"
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px"
  };

  const thtd = {
    border: "1px solid #374151",
    padding: "10px",
    textAlign: "left"
  };

  const thStyle = {
    ...thtd,
    background: "#111827"
  };

  return (
    <div style={pageStyle}>
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
        OptiMind Dataset Instructions
      </h1>

      {/* Model Selection */}
      <div style={sectionStyle}>
        <h2>Model Selection Rule</h2>

        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Dataset Rows</th>
              <th style={thStyle}>Model Used</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td style={thtd}>≤ 100 rows</td>
              <td style={thtd}>LSTM Forecasting</td>
            </tr>

            <tr>
              <td style={thtd}>{">"} 100 rows</td>
              <td style={thtd}>Transformer Forecasting</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* LSTM */}
      <div style={sectionStyle}>
        <h2>LSTM Model Requirements</h2>

        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Column Name</th>
              <th style={thStyle}>Required</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Notes</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td style={thtd}>Date</td>
              <td style={thtd}>Yes</td>
              <td style={thtd}>Date</td>
              <td style={thtd}>Must be valid date</td>
            </tr>

            <tr>
              <td style={thtd}>SKU_ID</td>
              <td style={thtd}>Yes</td>
              <td style={thtd}>String / Numeric</td>
              <td style={thtd}>Must match trained SKUs</td>
            </tr>

            <tr>
              <td style={thtd}>Units_Sold</td>
              <td style={thtd}>Yes</td>
              <td style={thtd}>Numeric</td>
              <td style={thtd}>No text allowed</td>
            </tr>
          </tbody>
        </table>

        <ul style={{ marginTop: "15px" }}>
          <li>Each SKU must contain at least <b>28 rows</b>.</li>
          <li>Dates must represent daily sequential sales.</li>
          <li>No missing values allowed.</li>
          <li>Sales values must be numeric and non-negative.</li>
        </ul>
      </div>

      {/* Transformer */}
      <div style={sectionStyle}>
        <h2>Transformer Model Requirements</h2>

        <ul>
          <li>Columns must follow the format: <b>d_1, d_2, d_3 ... d_n</b></li>
          <li>Each column represents one day of sales.</li>
          <li>Dataset must contain at least <b>SEQ_LEN daily columns</b>.</li>
          <li>All values must be numeric.</li>
        </ul>

        <table style={{ ...tableStyle, marginTop: "15px" }}>
          <thead>
            <tr>
              <th style={thStyle}>SKU_ID</th>
              <th style={thStyle}>d_1</th>
              <th style={thStyle}>d_2</th>
              <th style={thStyle}>d_3</th>
              <th style={thStyle}>...</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td style={thtd}>SKU_1</td>
              <td style={thtd}>25</td>
              <td style={thtd}>30</td>
              <td style={thtd}>27</td>
              <td style={thtd}>...</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* General Rules */}
      <div style={sectionStyle}>
        <h2>General Dataset Rules</h2>

        <ul>
          <li>Supported formats: <b>.csv</b> and <b>.xlsx</b></li>
          <li>Avoid duplicate rows.</li>
          <li>Negative sales values are not allowed.</li>
          <li>Datasets should contain realistic sales values.</li>
        </ul>
      </div>

      {/* Back Button */}
      <div style={{ textAlign: "center", marginTop: "30px" }}>
        <button
          onClick={() => navigate("/upload")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#6366F1",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          ← Back to Upload
        </button>
      </div>
    </div>
  );
}