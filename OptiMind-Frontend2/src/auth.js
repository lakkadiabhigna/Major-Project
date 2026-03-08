// src/auth.js

const API = "http://localhost:8000/api/auth";

export async function signup(name, email, password) {
  const res = await fetch(`${API}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, email, password }),
  });

  return res.json();
}

export async function login(email, password) {
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  return res.json();
}

export async function logout() {
  await fetch(`${API}/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export async function getCurrentUser() {
  const res = await fetch(`${API}/me`, {
    credentials: "include",
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.user;
}
