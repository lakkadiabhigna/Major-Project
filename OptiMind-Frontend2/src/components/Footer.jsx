// import React from "react";
// import { Link } from "react-router-dom";

// export default function Footer() {
//   return (
//     <footer className="footer">
//       <div>© {new Date().getFullYear()} OptiMind • NGIT • Dept. of CSE</div>

//       <div className="footerLinks">
//         <Link to="/about#problem">Problem</Link>
//         <Link to="/about#solution">Solution</Link>
//         <Link to="/about#how">How It Works</Link>
//       </div>
//     </footer>
//   );
// }

import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div>© {new Date().getFullYear()} OptiMind • NGIT • Dept. of CSE</div>

      <div className="footerLinks">
        <Link to="/about#problem">Problem</Link>
        <Link to="/about#solution">Solution</Link>
        <Link to="/about#how">How It Works</Link>
      </div>
    </footer>
  );
}
