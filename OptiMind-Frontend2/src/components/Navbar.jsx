import React from "react";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="logo">O</div>
        <div>
          <div className="brandName">OptiMind</div>
          <div className="brandTag">Deep Learning & Transformer Powered Supply Network</div>
        </div>
      </div>

      <nav className="navLinks">
        <NavLink className="navLink" to="/">Home</NavLink>
        <NavLink className="navLink" to="/dashboard">Dashboard</NavLink>
        <NavLink className="navLink" to="/about">About</NavLink>
        <NavLink className="navLink" to="/upload">Upload</NavLink>
        <NavLink className="navBtnGhost" to="/signup">Signup</NavLink>
        <NavLink className="navBtnPrimary" to="/login">Login</NavLink>
      </nav>
    </header>
  );
}