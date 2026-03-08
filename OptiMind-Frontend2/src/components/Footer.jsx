import React from "react";

export default function Footer() {
  return (
    <footer className="footer">
      <div>© {new Date().getFullYear()} OptiMind • NGIT • Dept. of CSE</div>
      <div className="footerLinks">
        <a href="#problem">Problem</a>
        <a href="#solution">Solution</a>
        <a href="#how">How It Works</a>
      </div>
    </footer>
  );
}