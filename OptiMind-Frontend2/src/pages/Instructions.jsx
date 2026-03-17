// import React from "react";
// import { useNavigate } from "react-router-dom";

// export default function Instructions() {
//   const navigate = useNavigate();

//   const pageStyle = {
//     maxWidth: "1000px",
//     margin: "40px auto",
//     padding: "20px",
//     color: "#e5e7eb"
//   };

//   const sectionStyle = {
//     background: "#1f2937",
//     padding: "25px",
//     borderRadius: "10px",
//     marginBottom: "25px",
//     boxShadow: "0 2px 10px rgba(0,0,0,0.4)"
//   };

//   const tableStyle = {
//     width: "100%",
//     borderCollapse: "collapse",
//     marginTop: "10px"
//   };

//   const thtd = {
//     border: "1px solid #374151",
//     padding: "10px",
//     textAlign: "left"
//   };

//   const thStyle = {
//     ...thtd,
//     background: "#111827"
//   };

//   return (
//     <div style={pageStyle}>
//       <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
//         OptiMind Dataset Instructions
//       </h1>

//       {/* Model Selection */}
//       <div style={sectionStyle}>
//         <h2>Model Selection Rule</h2>

//         <table style={tableStyle}>
//           <thead>
//             <tr>
//               <th style={thStyle}>Dataset Rows</th>
//               <th style={thStyle}>Model Used</th>
//             </tr>
//           </thead>

//           <tbody>
//             <tr>
//               <td style={thtd}>≤ 100 rows</td>
//               <td style={thtd}>LSTM Forecasting</td>
//             </tr>

//             <tr>
//               <td style={thtd}>{">"} 100 rows</td>
//               <td style={thtd}>Transformer Forecasting</td>
//             </tr>
//           </tbody>
//         </table>
//       </div>

//       {/* LSTM */}
//       <div style={sectionStyle}>
//         <h2>LSTM Model Requirements</h2>

//         <table style={tableStyle}>
//           <thead>
//             <tr>
//               <th style={thStyle}>Column Name</th>
//               <th style={thStyle}>Required</th>
//               <th style={thStyle}>Type</th>
//               <th style={thStyle}>Notes</th>
//             </tr>
//           </thead>

//           <tbody>
//             <tr>
//               <td style={thtd}>Date</td>
//               <td style={thtd}>Yes</td>
//               <td style={thtd}>Date</td>
//               <td style={thtd}>Must be valid date</td>
//             </tr>

//             <tr>
//               <td style={thtd}>SKU_ID</td>
//               <td style={thtd}>Yes</td>
//               <td style={thtd}>String / Numeric</td>
//               <td style={thtd}>Must match trained SKUs</td>
//             </tr>

//             <tr>
//               <td style={thtd}>Units_Sold</td>
//               <td style={thtd}>Yes</td>
//               <td style={thtd}>Numeric</td>
//               <td style={thtd}>No text allowed</td>
//             </tr>
//           </tbody>
//         </table>

//         <ul style={{ marginTop: "15px" }}>
//           <li>Each SKU must contain at least <b>28 rows</b>.</li>
//           <li>Dates must represent daily sequential sales.</li>
//           <li>No missing values allowed.</li>
//           <li>Sales values must be numeric and non-negative.</li>
//         </ul>
//       </div>

//       {/* Transformer */}
//       <div style={sectionStyle}>
//         <h2>Transformer Model Requirements</h2>

//         <ul>
//           <li>Columns must follow the format: <b>d_1, d_2, d_3 ... d_n</b></li>
//           <li>Each column represents one day of sales.</li>
//           <li>Dataset must contain at least <b>SEQ_LEN daily columns</b>.</li>
//           <li>All values must be numeric.</li>
//         </ul>

//         <table style={{ ...tableStyle, marginTop: "15px" }}>
//           <thead>
//             <tr>
//               <th style={thStyle}>SKU_ID</th>
//               <th style={thStyle}>d_1</th>
//               <th style={thStyle}>d_2</th>
//               <th style={thStyle}>d_3</th>
//               <th style={thStyle}>...</th>
//             </tr>
//           </thead>

//           <tbody>
//             <tr>
//               <td style={thtd}>SKU_1</td>
//               <td style={thtd}>25</td>
//               <td style={thtd}>30</td>
//               <td style={thtd}>27</td>
//               <td style={thtd}>...</td>
//             </tr>
//           </tbody>
//         </table>
//       </div>

//       {/* General Rules */}
//       <div style={sectionStyle}>
//         <h2>General Dataset Rules</h2>

//         <ul>
//           <li>Supported formats: <b>.csv</b> and <b>.xlsx</b></li>
//           <li>Avoid duplicate rows.</li>
//           <li>Negative sales values are not allowed.</li>
//           <li>Datasets should contain realistic sales values.</li>
//         </ul>
//       </div>

//       {/* Back Button */}
//       <div style={{ textAlign: "center", marginTop: "30px" }}>
//         <button
//           onClick={() => navigate("/upload")}
//           style={{
//             padding: "12px 24px",
//             backgroundColor: "#6366F1",
//             color: "white",
//             border: "none",
//             borderRadius: "6px",
//             cursor: "pointer",
//             fontSize: "16px"
//           }}
//         >
//           ← Back to Upload
//         </button>
//       </div>
//     </div>
//   );
// }
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Instructions() {
  const navigate = useNavigate();

  const pageStyle = {
    maxWidth: "1100px",
    margin: "50px auto",
    padding: "30px",
    color: "#f9fafb",
    fontFamily: "sans-serif",
  };

  const titleStyle = {
    textAlign: "center",
    marginBottom: "40px",
    fontSize: "32px",
    fontWeight: "700",
    letterSpacing: "0.5px",
  };

  const sectionStyle = {
    background: "linear-gradient(145deg, #1f2937, #111827)",
    padding: "28px",
    borderRadius: "16px",
    marginBottom: "30px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
    border: "1px solid #374151",
  };

  const sectionTitle = {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "15px",
    color: "#e0e7ff",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "15px",
    borderRadius: "10px",
    overflow: "hidden",
  };

  const thtd = {
    border: "1px solid #374151",
    padding: "12px",
    textAlign: "left",
    fontSize: "14px",
  };

  const thStyle = {
    ...thtd,
    background: "#111827",
    color: "#c7d2fe",
    fontWeight: "600",
  };

  const rowHover = {
    transition: "0.2s",
    cursor: "pointer",
  };

  const listStyle = {
    marginTop: "15px",
    paddingLeft: "20px",
    lineHeight: "1.8",
    color: "#d1d5db",
  };

  const buttonStyle = {
    padding: "14px 32px",
    background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "17px",
    fontWeight: "600",
    boxShadow: "0 6px 15px rgba(99,102,241,0.4)",
    transition: "0.3s",
  };

  return (
    <div style={pageStyle}>
      <h1 style={titleStyle}>OptiMind Dataset Instructions</h1>

      {/* Model Selection */}
      <div style={sectionStyle}>
        <h2 style={sectionTitle}>Model Selection Rule</h2>

        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Dataset Rows</th>
              <th style={thStyle}>Model Used</th>
            </tr>
          </thead>

          <tbody>
            <tr style={rowHover}>
              <td style={thtd}>≤ 100 rows</td>
              <td style={thtd}>LSTM Forecasting</td>
            </tr>

            <tr style={rowHover}>
              <td style={thtd}>{">"} 100 rows</td>
              <td style={thtd}>Transformer Forecasting</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* LSTM */}
      <div style={sectionStyle}>
        <h2 style={sectionTitle}>LSTM Model Requirements</h2>

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
            <tr style={rowHover}>
              <td style={thtd}>Date</td>
              <td style={thtd}>Yes</td>
              <td style={thtd}>Date</td>
              <td style={thtd}>Must be valid date</td>
            </tr>

            <tr style={rowHover}>
              <td style={thtd}>SKU_ID</td>
              <td style={thtd}>Yes</td>
              <td style={thtd}>String / Numeric</td>
              <td style={thtd}>Must match trained SKUs</td>
            </tr>

            <tr style={rowHover}>
              <td style={thtd}>Units_Sold</td>
              <td style={thtd}>Yes</td>
              <td style={thtd}>Numeric</td>
              <td style={thtd}>No text allowed</td>
            </tr>
          </tbody>
        </table>

        <ul style={listStyle}>
          <li>
            Each SKU must contain at least <b>28 rows</b>.
          </li>
          <li>Dates must represent daily sequential sales.</li>
          <li>No missing values allowed.</li>
          <li>Sales values must be numeric and non-negative.</li>
        </ul>
      </div>

      {/* Transformer */}
      <div style={sectionStyle}>
        <h2 style={sectionTitle}>Transformer Model Requirements</h2>

        <ul style={listStyle}>
          <li>
            Columns must follow the format: <b>d_1, d_2, d_3 ... d_n</b>
          </li>
          <li>Each column represents one day of sales.</li>
          <li>
            Dataset must contain at least <b>SEQ_LEN daily columns</b>.
          </li>
          <li>All values must be numeric.</li>
        </ul>

        <table style={tableStyle}>
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
            <tr style={rowHover}>
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
        <h2 style={sectionTitle}>General Dataset Rules</h2>

        <ul style={listStyle}>
          <li>
            Supported formats: <b>.csv</b> and <b>.xlsx</b>
          </li>
          <li>Avoid duplicate rows.</li>
          <li>Negative sales values are not allowed.</li>
          <li>Datasets should contain realistic sales values.</li>
        </ul>
      </div>

      {/* Back Button */}
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <button
          onClick={() => navigate("/upload")}
          style={buttonStyle}
          onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
          onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
        >
          ← Back to Upload
        </button>
      </div>
    </div>
  );
}
