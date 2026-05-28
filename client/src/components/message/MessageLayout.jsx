import { useState } from "react";
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";

export default function MessageLayout() {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div
      className="d-flex"
      style={{
        height: "100vh",
        background: "#000",
        color: "#fff",
      }}
    >
      <ChatSidebar onSelectUser={setSelectedUser} />
      <ChatWindow selectedUser={selectedUser} />
    </div>
  );
}
