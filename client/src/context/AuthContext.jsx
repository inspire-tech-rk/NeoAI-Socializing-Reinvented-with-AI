import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myPosts, setMyPosts] = useState([]);

 useEffect(() => {
  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true,
      });

      setUser(res.data);

      const postsRes = await axios.get(`${API_URL}/api/posts/me`, {
        withCredentials: true,
      });

      setMyPosts(postsRes.data);

    } catch (err) {

      // ✅ If 401 → user not logged in (normal)
      if (err.response && err.response.status === 401) {
        setUser(null);
        setMyPosts([]);
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
        myPosts,
        setMyPosts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
