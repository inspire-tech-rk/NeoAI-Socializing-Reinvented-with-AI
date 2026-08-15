import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="text-center mt-5">
        Connecting to server...
      </div>
    );
  }

  return user ? children : <Navigate to="/auth" replace />;
}