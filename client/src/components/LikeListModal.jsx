import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";

export default function LikeListModal({ likes, onClose }) {
  const navigate = useNavigate();

  return (
    <>
      <div
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
        style={{ zIndex: 2000 }}
        onClick={onClose}
      />

      <div
        className="position-fixed top-50 start-50 translate-middle bg-white rounded shadow p-3"
        style={{ width: 350, maxHeight: 400, zIndex: 2001, overflowY: "auto" }}
      >
        <h5 className="border-bottom pb-2 mb-3">Liked by</h5>

        {likes?.length === 0 ? (
          <p>No likes yet</p>
        ) : (
          likes.map((user) => (
            <div
              key={user._id}
              className="d-flex align-items-center gap-2 mb-2"
              style={{ cursor: "pointer" }}
              onClick={() => {
                navigate(`/profile/${user._id}`);
                onClose();
              }}
            >
              <img
                src={
                  user?.dp
                    ? user.dp.startsWith("http")
                      ? user.dp
                      : `${API_URL}/${user.dp.replace(/^\/+/, "")}`
                    : "/avatar.png"
                }
                alt=""
                width="35"
                height="35"
                className="rounded-circle"
                style={{ objectFit: "cover" }}
              />
              <strong>{user.username}</strong>
            </div>
          ))
        )}

        <button
          className="btn btn-sm btn-secondary w-100 mt-2"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </>
  );
}
