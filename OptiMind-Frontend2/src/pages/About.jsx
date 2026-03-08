import React from "react";

export default function About() {
  return (
    <section className="page">
      <h1 className="pageTitle">About OptiMind</h1>
      <p className="subtext">
        OptiMind helps teams forecast demand, optimize inventory, and explain
        recommendations with clarity.
      </p>

      {/* WHAT IT ENABLES */}
      <div className="aboutSection">
        <h2 className="sectionHeading">What OptiMind Enables</h2>

        <div className="aboutGrid">
          <div className="aboutCard">
            <div className="aboutTitle">Forecasting</div>
            <div className="aboutText">AI-based demand prediction</div>
          </div>

          <div className="aboutCard">
            <div className="aboutTitle">Optimization</div>
            <div className="aboutText">Smarter inventory planning</div>
          </div>

          <div className="aboutCard">
            <div className="aboutTitle">Explainability</div>
            <div className="aboutText">Transparent decisions</div>
          </div>
        </div>
      </div>

      {/* PROBLEM */}
      <div className="aboutSection">
        <h2 className="sectionHeading">The Problem</h2>

        <div className="aboutGrid">
          <div className="aboutCard">
            <div className="aboutTitle">Manual & Static Forecasting</div>
            <ul className="aboutList">
              <li>Spreadsheets can’t capture dynamic demand</li>
              <li>Hard to account for trend and seasonality</li>
              <li>Leads to wrong replenishment decisions</li>
            </ul>
          </div>

          <div className="aboutCard">
            <div className="aboutTitle">Stockouts & Overstocking</div>
            <ul className="aboutList">
              <li>Stockouts impact revenue and trust</li>
              <li>Overstock increases holding cost</li>
              <li>Inventory becomes inefficient and costly</li>
            </ul>
          </div>

          <div className="aboutCard">
            <div className="aboutTitle">Low Transparency</div>
            <ul className="aboutList">
              <li>No clear reasoning behind decisions</li>
              <li>Managers hesitate to trust predictions</li>
              <li>Lack of explainability reduces adoption</li>
            </ul>
          </div>
        </div>
      </div>

      {/* SOLUTION */}
      <div className="aboutSection">
        <h2 className="sectionHeading">Our Solution</h2>

        <div className="aboutGrid">
          <div className="aboutCard">
            <div className="aboutTitle">Deep Learning Forecasting</div>
            <ul className="aboutList">
              <li>AI predicts future demand from historical sales</li>
              <li>Captures patterns, trend and seasonality</li>
              <li>Improves planning accuracy</li>
            </ul>
          </div>

          <div className="aboutCard">
            <div className="aboutTitle">Optimization Layer</div>
            <ul className="aboutList">
              <li>Uses predictions for inventory recommendations</li>
              <li>Supports bulk planning across many SKUs</li>
              <li>Helps reduce operational inefficiencies</li>
            </ul>
          </div>

          <div className="aboutCard">
            <div className="aboutTitle">Explainable AI + Dashboard</div>
            <ul className="aboutList">
              <li>Explains drivers behind each recommendation</li>
              <li>Builds trust through transparency</li>
              <li>Enables decision-making through UI</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}