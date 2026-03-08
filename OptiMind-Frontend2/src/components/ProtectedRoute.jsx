// import React from "react";
// import { Navigate, useLocation } from "react-router-dom";
// import { isLoggedIn } from "../auth";

// export default function ProtectedRoute({ children }) {
//   const location = useLocation();

//   if (!isLoggedIn()) {
//     return <Navigate to="/login" replace state={{ from: location.pathname }} />;
//   }

//   return children;
// }

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../auth";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function check() {
      const u = await getCurrentUser();
      setUser(u);
      setLoading(false);
    }
    check();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
