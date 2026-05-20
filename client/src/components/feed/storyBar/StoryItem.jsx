import StoryRing from "../../story/StoryRing";

export default function StoryItem({ item, onClick }) {
  if (!item?.user) return null;

  return (
    <div
      className="text-center mx-2"
      style={{ cursor: "pointer", width: 70 }}
    >
      <StoryRing
        user={item.user}
        hasStory={true}      // ✅ REQUIRED
        hasNew={!item.seen}  // optional (if backend sends seen flag)
        onClick={onClick}    // ✅ REQUIRED
        size={64}
      />
      <small className="d-block text-truncate">
        {item.user.username}
      </small>
    </div>
  );
}
