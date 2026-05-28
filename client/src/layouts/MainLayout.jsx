import Sidebar from "../components/sidebar/Sidebar";
import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function MainLayout({ children }) {
  const { user } = useContext(AuthContext);

  // ✅ SIDEBAR STATE
  const [hovered, setHovered] = useState(false);

  return (
    <div className="d-flex">
      {/* ✅ DESKTOP SIDEBAR */}
      <div className="desktop-sidebar">
        <Sidebar
          currentUser={user}
          hovered={hovered}
          setHovered={setHovered}
        />
      </div>

      {/* ✅ MAIN CONTENT */}
      <div
        className="main-layout-content"
        style={{
          marginLeft: hovered ? "240px" : "80px",
          width: hovered
            ? "calc(100% - 240px)"
            : "calc(100% - 80px)",
          transition: "all 0.3s ease",
        }}
      >
        {children}
      </div>

      {/* ✅ MOBILE BOTTOM NAV */}
      <div
        className="mobile-bottom-nav position-fixed bottom-0 start-0 w-100 bg-black text-white justify-content-around align-items-center"
        style={{
          height: 60,
          zIndex: 5000,
          borderTop: "1px solid #2c2c2c",
        }}
      >
        <Link to="/" className="text-white fs-4">
          <i className="bi bi-house-door-fill"></i>
        </Link>

        <Link to="/reels" className="text-white fs-4">
          <i className="bi bi-film"></i>
        </Link>

        <Link to="/create" className="text-white fs-4">
          <i className="bi bi-plus-square"></i>
        </Link>

        <Link to="/messages" className="text-white fs-4">
          <i className="bi bi-chat-dots"></i>
        </Link>

        <Link to="/profile" className="text-white fs-4">
          <i className="bi bi-person-circle"></i>
        </Link>
      </div>
    </div>
  );
}