import React, { useState, useEffect, useRef } from "react";
import api from "../api.js";
import { useNavigate } from "react-router-dom";

function ListingsHome() {
  const [city, setCity] = useState("");
  const [error, setError] = useState(null);
  const [radius, setRadius] = useState("5");
  const [latLng, setLatLng] = useState({ lat: null, lng: null });
  const [citySelected, setCitySelected] = useState(false);
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
        initAutocomplete();
      };
    } else {
      initAutocomplete();
    }

    function initAutocomplete() {
      if (!window.google || !locationInputRef.current) {
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
          setCitySelected(true);
        }
      });
    }
  }, []);

  // If user types in the field, mark city as "not selected"
  const handleCityChange = (e) => {
    setCity(e.target.value);
    setLatLng({ lat: null, lng: null });
    setCitySelected(false); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (city && !citySelected) {
      setError("Please select a city from the dropdown.");
      return;
    }

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
                    onChange={handleCityChange}
                    required
                    aria-label="City"
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
                {/* Show warning if city not selected */}
                {city && !citySelected && (
                  <small className="text-danger">
                    Please select a city from the dropdown.
                  </small>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 mt-2"
                disabled={city && !citySelected}
                title={
                  city && !citySelected
                    ? "Please select a city from the dropdown"
                    : ""
                }
              >
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
