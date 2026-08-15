import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auth/me`, {
          withCredentials: true,
          timeout: 5000,
        });

        setUser(res.data);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          setUser(null);
        } else {
          console.error("Auth error:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};