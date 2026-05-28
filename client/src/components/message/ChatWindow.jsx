import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import MessageHeader from "./MessageHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

export default function ChatWindow({ selectedUser }) {
  const [messages, setMessages] = useState([]);

  // 🔥 reusable fetch function
  const fetchMessages = useCallback(async () => {
    if (!selectedUser?._id) return;

    try {
      const res = await axios.get(
        `${API_URL}/api/messages/${selectedUser._id}`,
        { withCredentials: true },
      );

      setMessages(res.data);
    } catch (err) {
      console.error("Error fetching messages", err);
    }
  }, [selectedUser]);

 useEffect(() => {
  if (!selectedUser) return;

  axios.put(
    `${API_URL}/api/messages/seen/${selectedUser._id}`,
    {},
    { withCredentials: true }
  );
}, [selectedUser]);


  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  if (!selectedUser) {
    return (
      <div className="flex-grow-1 d-flex justify-content-center align-items-center">
        <h5 className="text-muted">Select a conversation</h5>
      </div>
    );
  }

  return (
    <div
  className="flex-grow-1 d-flex flex-column chat-window"
      style={{ height: "100vh", minHeight: 0 }} // 🔥 important
    >
      {/* Header */}
      <MessageHeader selectedUser={selectedUser} />

      {/* Scrollable Message Area */}
      <div
        className="flex-grow-1 d-flex"
        style={{ minHeight: 0 }} // 🔥 critical
      >
        <MessageList messages={messages} selectedUser={selectedUser} />
      </div>

      {/* Input */}
      <MessageInput
        selectedUser={selectedUser}
        refreshMessages={fetchMessages}
        setMessages={setMessages}
      />
    </div>
  );
}
