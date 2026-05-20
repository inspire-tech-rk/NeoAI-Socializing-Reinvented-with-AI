import Sidebar from "../components/sidebar/Sidebar";
import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";

export default function MainLayout({ children }) {
  const { user } = useContext(AuthContext);

  // ✅ SIDEBAR STATE
  const [hovered, setHovered] = useState(false);

  return (
    <div className="d-flex">
      <Sidebar
        currentUser={user}
        hovered={hovered}
        setHovered={setHovered}
      />

      {/* ✅ MAIN CONTENT */}
      <div
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
    </div>
  );
}