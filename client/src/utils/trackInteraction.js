import axios from "axios";
import { API_URL } from "../config";

export const trackView = async (contentId, watchTime) => {
  try {
    await axios.post(
      `${API_URL}/api/recommendations/track`,
      { contentId, watchTime },
      { withCredentials: true }
    );

    // 🔥 refresh ML recommendations after watch/view
    window.dispatchEvent(new Event("reel-interaction-updated"));
  } catch (err) {
    console.error("Tracking failed:", err.message);
  }
};