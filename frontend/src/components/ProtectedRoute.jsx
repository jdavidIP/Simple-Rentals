import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants";
import { useState, useEffect } from "react";

function ProtectedRoute({ children }) {
  const [isAuthorized, setAuthorized] = useState(null);

  useEffect(() => {
    auth().catch(() => setAuthorized(false));
  }, []);

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN);

    if (!refreshToken) {
      console.error("No refresh token found.");
      setAuthorized(false);
      return;
    }

    try {
      const res = await api.post("/api/token/refresh/", {
        refresh: refreshToken,
      });

      if (res.status === 200) {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        setAuthorized(true);
      } else {
        console.error("Failed to refresh token:", res);
        localStorage.clear();
        setAuthorized(false);
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      localStorage.clear();
      setAuthorized(false);
    }
  };

  const auth = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      setAuthorized(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const expirationTime = decoded.exp;
      const now = Date.now() / 1000;

      if (expirationTime < now) {
        console.log("Token expired, refreshing...");
        await refreshToken();
      } else {
        setAuthorized(true);
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      setAuthorized(false);
    }
  };

  if (isAuthorized === null) {
    return <div>Loading...</div>;
  }

  return isAuthorized ? children : <Navigate to="/login" />;
}

export default ProtectedRoute;
