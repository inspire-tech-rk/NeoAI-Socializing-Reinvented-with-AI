import { useState } from "react";
import axios from "axios";

export default function FollowButton({
  userId,
  initialIsFollowing,
  onFollowChange,
}) {
  const [status, setStatus] = useState(
    initialIsFollowing ? "following" : "follow"
  );
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const res = await axios.post(
        `http://localhost:5000/api/users/${userId}/follow`,
        {},
        { withCredentials: true }
      );

      if (res.data.requested) {
        setStatus("requested");
      } else if (res.data.following) {
        setStatus("following");
      } else {
        setStatus("follow");
      }

      onFollowChange?.({
        userId,
        status: res.data.requested
          ? "requested"
          : res.data.following
          ? "following"
          : "follow",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      style={{
        padding: "4px 12px",
        fontSize: 12,
        fontWeight: 600,
        background:
          status === "follow" ? "#0095f6" : "#fff",
        color:
          status === "follow" ? "#fff" : "#262626",
        border:
          status === "follow" ? "none" : "1px solid #dbdbdb",
        borderRadius: 4,
        cursor: "pointer",
      }}
    >
      {loading
        ? "..."
        : status === "following"
        ? "Following"
        : status === "requested"
        ? "Requested"
        : "Follow"}
    </button>
  );
}

