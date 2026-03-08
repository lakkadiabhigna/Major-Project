import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../auth";

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();

    setErr("");
    setLoading(true);

    try {
      const res = await signup("", email, password);

      if (!res.ok) {
        setErr(res.message || "Signup failed");
        setLoading(false);
        return;
      }

      navigate("/dashboard");
    } catch {
      setErr("Server error");
    }

    setLoading(false);
  }

  return (
    <div className="authWrap">
      <div className="authCard">
        <h2 className="authTitle">Create Account</h2>

        {err ? <div className="authError">{err}</div> : null}

        <form className="authForm" onSubmit={onSubmit}>
          <label className="authLabel">Email</label>
          <input
            className="authInput"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="authLabel">Password</label>
          <input
            className="authInput"
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* ✅ Green signup button */}
          <button className="authBtn" type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <div className="authFooterRow">
          <span className="muted">Already have an account?</span>
          <Link className="authLinkBtn" to="/login">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
