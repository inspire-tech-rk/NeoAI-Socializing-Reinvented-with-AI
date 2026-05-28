import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import { AuthContext } from "../../context/AuthContext";
import ChatUserItem from "./ChatUserItem";

export default function ChatSidebar({ onSelectUser }) {
  const { currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchMutualUsers = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/messages/mutual`,
          { withCredentials: true }
        );
        setUsers(res.data);
      } catch (err) {
        console.error("Error fetching mutual users", err);
      }
    };

    fetchMutualUsers();
  }, []);

 return (
  <div
    style={{
      width: "350px",
      borderRight: "1px solid #2c2c2c",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
    }}
  >
    {/* 🔥 TOP BRAND SECTION */}
    <div
      style={{
        padding: "15px",
        borderBottom: "1px solid #2c2c2c",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      {/* LOGO */}
      <img
        src="/neoaiLogo.png"   // ✅ use same logo as MainSidebar
        alt="logo"
        style={{
          width: "35px",
          height: "35px",
          borderRadius: "8px",
          objectFit: "cover",
        }}
      />

      {/* APP NAME */}
      <h5 style={{ margin: 0, fontWeight: "bold" }}>NeoAI</h5>
    </div>

    {/* 🔥 USER LIST SECTION */}
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "15px",
      }}
    >
      <h6 className="fw-bold mb-3">Chats</h6>

      {users.length === 0 && (
        <p className="text-muted">No chats yet</p>
      )}

      {users.map((user) => (
        <ChatUserItem
          key={user._id}
          user={user}
          onClick={() => onSelectUser(user)}
        />
      ))}
    </div>
  </div>
);

}
