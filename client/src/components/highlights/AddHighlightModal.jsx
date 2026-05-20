import { useEffect, useState } from "react";
import authAxios from "../../api/authAxios";

export default function AddHighlightModal({ onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ FIX: Prevent modal shift (Bootstrap behavior)
  useEffect(() => {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.classList.add("modal-open");

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      document.body.classList.remove("modal-open");
    };
  }, []);

  const submit = async () => {
    if (!title || files.length === 0) {
      return alert("Title and at least one image required");
    }

    const formData = new FormData();
    formData.append("title", title);
    [...files].forEach((f) => formData.append("files", f));

    try {
      setLoading(true);
      await authAxios.post("/highlights", formData);
      onCreated();
      onClose();
    } catch (err) {
      console.error("Create highlight failed", err);
      alert("Failed to create highlight");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* BACKDROP */}
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 2000 }}
        onClick={onClose}
      />

      {/* MODAL (FORCED CENTER) */}
      <div
        className="modal fade show d-flex"
        style={{
          zIndex: 2001,
          position: "fixed",
          inset: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="modal-dialog modal-dialog-centered modal-md m-0">
          <div className="modal-content rounded-4">

            {/* HEADER */}
            <div className="modal-header">
              <h5 className="modal-title">Create Highlight</h5>
              <button className="btn-close" onClick={onClose}></button>
            </div>

            {/* BODY */}
            <div className="modal-body">
              <div className="mb-3">
                <input
                  className="form-control"
                  placeholder="Highlight name"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <input
                  type="file"
                  className="form-control"
                  multiple
                  accept="image/*"
                  onChange={(e) => setFiles(e.target.files)}
                />
              </div>
            </div>

            {/* FOOTER */}
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={submit}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
