import SuggestionHeader from "./SuggestionHeader";
import SuggestionList from "./SuggestionList";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../../config";
import SwitchAccount from "./SwitchAccount";

export default function Suggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch suggestions from backend
  const fetchSuggestions = async () => {
    try {
      const res = await axios.get(
       `${API_URL}/api/users/suggestions`,
        { withCredentials: true }
      );
      setSuggestions(res.data);
    } catch (err) {
      console.error("Failed to fetch suggestions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  // Update local isFollowing state
const handleFollowChange = ({ userId, status }) => {
  setSuggestions((prev) =>
    prev.filter((u) => !(u._id === userId && status === "following"))
  );
};


  return (
    <div
      style={{
        width: 300,
        background: "#fff",
        borderRadius: 8,
        padding: "12px 16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        fontFamily: "Arial, sans-serif",
        fontSize: 14,
      }}
    >
      {/* Header */}
      <SwitchAccount />
      <SuggestionHeader />

      {/* Loading state */}
      {loading ? (
        <p
          className="text-center text-secondary"
          style={{ fontSize: 13, margin: "10px 0" }}
        >
          Loading...
        </p>
      ) : (
        <>
          {/* Suggestion list */}
          <SuggestionList
            suggestions={suggestions}
            onFollowChange={handleFollowChange}
          />

          {/* Footer "See All" like Instagram */}
          {suggestions.length > 5 && (
            <div
              className="text-end"
              style={{
                marginTop: 8,
              }}
            >
              <button
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#0095f6",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
                onClick={() => {
                  alert("Open full suggestions list (Instagram style)");
                }}
              >
                See All
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
