import { useEffect, useState } from "react";
import ReelCard from "./ReelCard";
import { API_URL } from "../../config";
import axios from "axios";
import "./reel.css";

export default function ReelFeed() {
  const [reels, setReels] = useState([]);

  const fetchReels = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/recommendations`, {
        withCredentials: true,
      });

      setReels(res.data);
    } catch (err) {
      console.error("Failed to load reels:", err);
    }
  };

  useEffect(() => {
    fetchReels();

    window.addEventListener("reel-interaction-updated", fetchReels);

    return () => {
      window.removeEventListener("reel-interaction-updated", fetchReels);
    };
  }, []);

  return (
    <div className="reel-container">
      {reels.map((reel) => (
        <div key={reel._id} className="reel-card">
          <ReelCard reel={reel} />
        </div>
      ))}
    </div>
  );
}