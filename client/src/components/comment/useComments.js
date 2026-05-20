import { useEffect, useState } from "react";
import { API_URL } from "../../config";

export default function useComments(targetId, targetType) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetId || !targetType) return;

    fetch(`${API_URL}/api/comments/${targetType}/${targetId}`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setComments(data);
        setLoading(false);
      });
  }, [targetId, targetType]);

  const addComment = async (text) => {
    if (!text.trim()) return;

    const res = await fetch(`${API_URL}/api/comments`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        targetId,
        targetType
      })
    });

    const newComment = await res.json();
    setComments(prev => [...prev, newComment]);
  };

  return { comments, addComment, loading };
}
