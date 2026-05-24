import { API_URL } from "../../../config";
import FollowButton from "./FollowButton";

const getMediaUrl = (file) => {
  if (!file) return "/default-dp.png";
  if (file.startsWith("http")) return file;
  return `${API_URL}/${file.replace(/^\/+/, "")}`;
};

export default function SuggestionItem({ suggestedUser, onFollowChange }) {
  const { username, dp, isFollowing, mutualCount, mutualNames, reason, _id } =
    suggestedUser;

  return (
    <div
      className="d-flex align-items-center justify-content-between"
      style={{ padding: "4px 0" }}
    >
      <div className="d-flex align-items-center gap-2">
        <img
          src={getMediaUrl(dp)}
          onError={(e) => (e.target.src = "/default-dp.png")}
          alt={username}
          className="rounded-circle"
          width={40}
          height={40}
          style={{ border: "1px solid #dbdbdb", objectFit: "cover" }}
        />

        <div className="d-flex flex-column">
          <strong style={{ fontSize: 14 }}>{username}</strong>

          {mutualCount > 0 ? (
            <small
              className="text-secondary"
              title={mutualNames.join(", ")}
              style={{ fontSize: 12 }}
            >
              Followed by {mutualNames[0]}
              {mutualCount > 1 ? ` and ${mutualCount - 1} others` : ""}
            </small>
          ) : (
            <small className="text-secondary" style={{ fontSize: 12 }}>
              {reason}
            </small>
          )}
        </div>
      </div>

      <FollowButton
        userId={_id}
        initialIsFollowing={isFollowing}
        onFollowChange={onFollowChange}
      />
    </div>
  );
}