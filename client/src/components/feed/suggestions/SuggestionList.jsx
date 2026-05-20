import SuggestionItem from "./SuggestionItem";

export default function SuggestionList({ suggestions, onFollowChange }) {
  return (
    <div className="d-flex flex-column gap-3" style={{ maxHeight: "60vh", overflowY: "auto" }}>
      {suggestions.map((user) => (
        <SuggestionItem
          key={user._id}
          suggestedUser={user}
          onFollowChange={onFollowChange}
        />
      ))}
    </div>
  );
}
