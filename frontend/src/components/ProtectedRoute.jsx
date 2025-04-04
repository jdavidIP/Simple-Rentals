import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api.js";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants.js";
import { useState, useEffect } from "react";

function ProtectedRoute({ children }) {
  const [isAuthorized, setAuthorized] = useState(false);

  useEffect(() => {
    auth().catch(() => setAuthorized(false));
  }, []);

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN);

    try {
      const res = await api.post("/marketplace/token/refresh/", {
        refresh: refreshToken,
      });

      if (res.status === 200) {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        setAuthorized(true);
      } else {
        setAuthorized(false);
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      setAuthorized(false);
    }
  };

  const auth = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      setAuthorized(false);
      return;
    }
    const decoded = jwtDecode(token);
    let expirationTime = decoded.exp;
    const now = Date.now() / 1000;

    if ((expirationTime = now)) {
      await refreshToken();
    } else {
      setAuthorized(true);
    }
  };

  if (isAuthorized === null) {
    return <div>Loading...</div>;
  }

  return isAuthorized ? children : <Navigate to="/login" />;
}

export default ProtectedRoute;
