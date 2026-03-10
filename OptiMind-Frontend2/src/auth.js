// // src/auth.js

// const API = "http://localhost:8000/api/auth";

// export async function signup(name, email, password) {
//   const res = await fetch(`${API}/signup`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     credentials: "include",
//     body: JSON.stringify({ name, email, password }),
//   });

//   return res.json();
// }

// export async function login(email, password) {
//   const res = await fetch(`${API}/login`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     credentials: "include",
//     body: JSON.stringify({ email, password }),
//   });

//   return res.json();
// }

// export async function logout() {
//   await fetch(`${API}/logout`, {
//     method: "POST",
//     credentials: "include",
//   });
// }

// export async function getCurrentUser() {
//   const res = await fetch(`${API}/me`, {
//     credentials: "include",
//   });

//   if (!res.ok) return null;

//   const data = await res.json();
//   return data.user;
// }

// src/auth.js

const API = "http://localhost:8000/api/auth";

export async function signup(name, email, password) {
  try {
    const res = await fetch(`${API}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Signup error:", err);
    return { ok: false, message: "Network error" };
  }
}

export async function login(email, password) {
  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Login error:", err);
    return { ok: false, message: "Network error" };
  }
}

export async function logout() {
  try {
    await fetch(`${API}/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (err) {
    console.error("Logout error:", err);
  }
}

export async function getCurrentUser() {
  try {
    const res = await fetch(`${API}/me`, {
      credentials: "include",
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.user;
  } catch (err) {
    console.error("User fetch error:", err);
    return null;
  }
}
