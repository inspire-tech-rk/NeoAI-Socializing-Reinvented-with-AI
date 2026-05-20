import { useState } from "react";
import StoryUpload from "../../story/StoryUpload";

export default function AddStoryButton({ onStoryAdded }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className="text-center mx-2 story-item"
        style={{ width: 70, cursor: "pointer" }}
        onClick={() => setOpen(true)}
      >
        <div className="add-story-circle">
          <span className="add-plus">+</span>
        </div>
        <small>Your story</small>
      </div>

      {open && (
        <StoryUpload
          onClose={() => setOpen(false)}
          onStoryAdded={onStoryAdded} // 🔥 IMPORTANT
        />
      )}
    </>
  );
}
