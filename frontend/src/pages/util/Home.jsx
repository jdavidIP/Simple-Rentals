import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api.js";

function Home() {
  const [htmlContent, setHtmlContent] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHomePage = async () => {
      try {
        // Send a GET request to the backend's home endpoint
        const response = await api.get("/");
        console.log("Home page data:", response.data);
        setHtmlContent(response.data);
      } catch (err) {
        console.error("Error fetching home page:", err);

        // Redirect to login if there's an error (e.g., unauthorized)
        if (err.response && err.response.status === 401) {
          navigate("/login");
        }
      }
    };

    fetchHomePage();
  }, [navigate]);

  return (
    <div
      className="home-container"
      dangerouslySetInnerHTML={{ __html: htmlContent }} // Render the HTML content
    ></div>
  );
}

export default Home;
