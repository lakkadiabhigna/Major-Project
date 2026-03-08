import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../auth";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();

    setErr("");
    setLoading(true);

    try {
      const res = await login(email, password);

      if (!res.ok) {
        setErr(res.message || "Login failed");
        setLoading(false);
        return;
      }

      navigate("/dashboard");
    } catch {
      setErr("Server error");
    }

    setLoading(false);
  };

  return (
    <div className="authWrap">
      <div className="authCard">
        <h1 className="authTitle">Login</h1>

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
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* stays green because your CSS makes .authBtn green */}
          <button className="authBtn" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="authFooterRow">
          <span className="muted">Don&apos;t have an account?</span>
          <Link className="authLinkBtn" to="/signup">
            Signup
          </Link>
        </div>
      </div>
    </div>
  );
}
