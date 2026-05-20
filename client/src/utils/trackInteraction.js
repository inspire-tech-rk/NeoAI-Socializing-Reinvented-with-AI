import axios from "axios";
import { API_URL } from "../config"; // ✅ ADD

export const trackView = async (contentId, watchTime) => {
  try {
    await axios.post(
      `${API_URL}/api/recommendations/track`,
      { contentId, watchTime }, // 🔥 FIXED
      { withCredentials: true }
    );
  } catch (err) {
    console.error("Tracking failed:", err.message);
  }
};

