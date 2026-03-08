import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const nav = useNavigate();

  return (
    <section className="hero heroSingle">
      <div className="heroLeft">
        <h1 className="pageTitle">OptiMind: AI-Powered Supply Network Intelligence</h1>

        <p className="subtext">
          OptiMind is a decision-support system that combines deep learning and transformer-based
          demand forecasting with inventory planning logic to provide explainable, data-driven
          recommendations through a modern dashboard.
        </p>

        <div className="ctaRow">
          {/* IMPORTANT: this should redirect to login (your ProtectedRoute already handles it) */}
          <button className="ctaPrimary" onClick={() => nav("/dashboard")}>
            View Dashboard
          </button>

          <button className="ctaSecondary" onClick={() => nav("/demo")}>
            Demo Report
          </button>
        </div>

        <div className="centerRow">
          <button className="ctaTertiary" onClick={() => nav("/about")}>
            Know Us More →
          </button>
        </div>
      </div>
    </section>
  );
}