import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../../constants.js";
import api from "../../api.js";

function LogOut() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);

        if (!refreshToken) {
          console.error("No refresh token found.");
          localStorage.clear();
          navigate("/login");
          return;
        }

        // Send a request to the backend to blacklist the refresh token
        await api.post("/logout/", { refresh: refreshToken });

        console.log("Logout successful.");
      } catch (err) {
        console.error("Error during logout:", err);
      } finally {
        // Clear tokens and redirect to login
        localStorage.clear();
        navigate("/login");
      }
    };

    handleLogout();
  }, [navigate]);

  return <div>Logging out...</div>;
}

export default LogOut;
