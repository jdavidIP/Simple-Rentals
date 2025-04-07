import api from "../api.js";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ListingsHome() {
  const [city, setCity] = useState(""); // State to store the city input
  const [error, setError] = useState(null); // State to handle errors
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Send a GET request to the backend with the city as a query parameter
      const response = await api.get("/listings/viewAll", {
        params: { location: city },
      });

      // Navigate to a results page or display the listings
      navigate("/listings/results", {
        state: { listings: response.data, city: city },
      });
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError("Failed to fetch listings. Please try again.");
    }
  };

  return (
    <div className="listings-home-container">
      <h1>Search for Listings</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit} className="form-container">
        <label htmlFor="city">Enter a city to start your search:</label>
        <input
          type="text"
          id="city"
          name="location"
          placeholder="City name"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>
    </div>
  );
}

export default ListingsHome;
