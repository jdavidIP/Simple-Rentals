import React, { useState, useEffect, useRef } from "react";
import api from "../api.js";
import { useNavigate } from "react-router-dom";

function ListingsHome() {
  const [city, setCity] = useState("");
  const [error, setError] = useState(null);
  const [radius, setRadius] = useState("5"); // Default 5 km radius
  const [latLng, setLatLng] = useState({ lat: null, lng: null }); // Coordinates from autocomplete
  const navigate = useNavigate();
  const locationInputRef = useRef(null);

  useEffect(() => {
    const existingScript = document.getElementById("googleMaps");

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCdOFDB8B2dHR7M6JXBfdZ-F-1XRjDm-2E&libraries=places`;
      script.id = "googleMaps";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      script.onload = () => {
        console.log("Google Maps script loaded!");
        initAutocomplete();
      };
    } else {
      initAutocomplete();
    }

    function initAutocomplete() {
      if (!window.google || !locationInputRef.current) {
        console.warn("Google Maps or input ref not ready");
        return;
      }

      const autocomplete = new window.google.maps.places.Autocomplete(
        locationInputRef.current
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          const { lat, lng } = place.geometry.location;
          setLatLng({
            lat: lat(),
            lng: lng(),
          });
          setCity(place.formatted_address);
        }
      });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const params = {
        location: city,
        radius: radius,
      };

      if (latLng.lat && latLng.lng) {
        params.lat = latLng.lat;
        params.lng = latLng.lng;
      }

      const response = await api.get("/listings/viewAll", { params });

      navigate("/listings/results", {
        state: { listings: response.data, city: city },
      });
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError("Failed to fetch listings. Please try again.");
    }
  };

  return (
    <div>
      <div
        className="d-flex align-items-center justify-content-center min-vh-100"
        style={{
          background: "linear-gradient(to right, #f8f9fa, #e9ecef)",
          padding: "20px",
        }}
      >
        <div
          className="card shadow p-4"
          style={{ maxWidth: "40rem", width: "100%" }}
        >
          <div className="card-body">
            <h2 className="card-title text-center mb-4">
              🏠 Find Your Next Rental
            </h2>
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="city" className="form-label">
                  Enter a city:
                </label>
                <div className="input-group">
                  <input
                    type="text"
                    id="city"
                    ref={locationInputRef}
                    className="form-control"
                    placeholder="e.g. Waterloo, Vancouver, Halifax"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />

                  <select
                    id="radius"
                    className="form-select"
                    style={{ maxWidth: "120px" }}
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                  >
                    <option value="1">1 km</option>
                    <option value="5">5 km</option>
                    <option value="10">10 km</option>
                    <option value="20">20 km</option>
                    <option value="50">50 km</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-100 mt-2">
                🔍 Search Listings
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ListingsHome;
