import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import FeedPage from "./FeedPage";

export default function Home() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <p className="text-center mt-5">Loading...</p>;

  if (!user) {
    window.location.href = "/auth";
    return null;
  }

  return (
    <>
      <FeedPage />
      
    </>
  );
}
