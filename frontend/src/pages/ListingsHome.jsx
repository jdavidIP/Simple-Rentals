import React, { useState } from "react";
import api from "../api.js";
import { useNavigate } from "react-router-dom";

function ListingsHome() {
  const [city, setCity] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.get("/listings/viewAll", {
        params: { location: city },
      });

      navigate("/listings/results", {
        state: { listings: response.data, city: city },
      });
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError("Failed to fetch listings. Please try again.");
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100"
      style={{
        background: "linear-gradient(to right, #f8f9fa, #e9ecef)",
        padding: "20px",
      }}
    >
      <div className="card shadow p-4" style={{ maxWidth: "40rem", width: "100%" }}>
        <div className="card-body">
          <h2 className="card-title text-center mb-4">🏠 Find Your Next Rental</h2>
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="city" className="form-label">
                Enter a city:
              </label>
              <input
                type="text"
                id="city"
                className="form-control"
                placeholder="e.g. Waterloo, Vancouver, Halifax"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100">
              🔍 Search Listings
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ListingsHome;
