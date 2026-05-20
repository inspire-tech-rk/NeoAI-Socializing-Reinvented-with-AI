import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import StoryItem from "./StoryItem";
import AddStoryButton from "./AddStoryButton";
import ScrollButtons from "./ScrollButtons";
import StoryViewer from "../../story/StoryViewer";
import "./storyBar.css";

export default function StoryBar() {
  const [stories, setStories] = useState([]);
  const [activeStory, setActiveStory] = useState(null);
  const scrollRef = useRef(null);

  // Fetch stories
  const fetchStories = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/stories/feed", {
        withCredentials: true,
      });
      setStories(res.data);
    } catch (err) {
      console.error("Story fetch failed:", err);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const openStory = (item) => setActiveStory(item);

  const handleDeleteStory = async (storyId) => {
    try {
      await axios.delete(`http://localhost:5000/api/stories/${storyId}`, {
        withCredentials: true,
      });
      setStories((prev) =>
        prev
          .map((group) => ({
            ...group,
            stories: group.stories.filter((s) => s._id !== storyId),
          }))
          .filter((group) => group.stories.length > 0)
      );
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <>
      <div className="bg-white border rounded mb-3 position-relative">
        <ScrollButtons containerRef={scrollRef} />

        <div
          ref={scrollRef}
          className="d-flex align-items-center overflow-auto px-2 py-3 story-scroll"
        >
          <AddStoryButton onStoryAdded={fetchStories} />

          {stories.map((item) => (
            <StoryItem
              key={item._id}
              item={item}
              onClick={() => openStory(item)}
            />
          ))}
        </div>
      </div>

      {activeStory && (
        <StoryViewer
          stories={activeStory.stories}
          onClose={() => setActiveStory(null)}
          onDeleteStory={handleDeleteStory}
        />
      )}
    </>
  );
}
