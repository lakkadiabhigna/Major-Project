import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DemoReport from "./pages/DemoReport.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Upload from "./pages/Upload.jsx";
import TransformerDashboard from "./pages/TransformerDashboard";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <div className="content">
          <Navbar />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />

            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              }
            />

            <Route
              path="/demo"
              element={
                <ProtectedRoute>
                  <DemoReport />
                </ProtectedRoute>
              }
            />

            <Route
              path="/transformer-dashboard"
              element={<TransformerDashboard />}
            />
          </Routes>

          <Footer />
        </div>
      </div>
    </BrowserRouter>
  );
}
