// import React from "react";
// import { NavLink } from "react-router-dom";

// export default function Navbar() {
//   return (
//     <header className="topbar">
//       <div className="brand">
//         <div className="logo">O</div>
//         <div>
//           <div className="brandName">OptiMind</div>
//           <div className="brandTag">
//             Deep Learning & Transformer Powered Supply Network
//           </div>
//         </div>
//       </div>

//       <nav className="navLinks">
//         <NavLink className="navLink" to="/">
//           Home
//         </NavLink>
//         <NavLink className="navLink" to="/dashboard">
//           Dashboard
//         </NavLink>
//         <NavLink className="navLink" to="/about">
//           About
//         </NavLink>
//         <NavLink className="navLink" to="/upload">
//           Upload
//         </NavLink>
//         <NavLink className="navBtnGhost" to="/signup">
//           Signup
//         </NavLink>
//         <NavLink className="navBtnPrimary" to="/login">
//           Login
//         </NavLink>
//       </nav>
//     </header>
//   );
// }

import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser, logout } from "../auth";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function fetchUser() {
      const u = await getCurrentUser();
      setUser(u);
    }
    fetchUser();
  }, [location]);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    navigate("/login");
  };

  return (
    <header className="topbar">
      <div className="brand">
        <div className="logo">O</div>
        <div>
          <div className="brandName">OptiMind</div>
          <div className="brandTag">
            Deep Learning & Transformer Powered Supply Network
          </div>
        </div>
      </div>

      <nav className="navLinks">
        <NavLink className="navLink" to="/">
          Home
        </NavLink>

        <NavLink className="navLink" to="/dashboard">
          Dashboard
        </NavLink>

        <NavLink className="navLink" to="/about">
          About
        </NavLink>

        <NavLink className="navLink" to="/upload">
          Upload
        </NavLink>

        {user ? (
          <>
            <span className="navUser">👤 {user.email}</span>

            <button className="navBtnPrimary" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <span className="navUser">👤 Unknown User</span>

            <NavLink className="navBtnGhost" to="/signup">
              Signup
            </NavLink>

            <NavLink className="navBtnPrimary" to="/login">
              Login
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
}
