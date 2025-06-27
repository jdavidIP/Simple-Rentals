import React, { useState, useEffect, useRef } from "react";
import api from "../api.js";
import { useLocation } from "react-router-dom";

import Header from "../components/header";
import Footer from "../components/footer";
import ListingCard from "../components/ListingCard.jsx";
import { useProfileContext } from "../contexts/ProfileContext.jsx";

function Listings() {
  const location = useLocation();
  const [listings, setListings] = useState(location.state?.listings || []);
  const [filters, setFilters] = useState({
    location: location.state?.city || "",
    min_price: "",
    max_price: "",
    bedrooms: "",
    bathrooms: "",
    property_type: "",
  });
  const [latLng, setLatLng] = useState({ lat: null, lng: null });
  const [radius, setRadius] = useState("5"); // Default radius
  const [error, setError] = useState(null);
  const [userIncome, setUserIncome] = useState(null);
  const errorRef = useRef(null);
  const locationInputRef = useRef(null);
  const { profile } = useProfileContext();

  const fetchListings = async (customFilters = filters) => {
    try {
      const params = { ...customFilters };

      if (latLng.lat && latLng.lng) {
        params.lat = latLng.lat;
        params.lng = latLng.lng;
        params.radius = radius;
      }

      const response = await api.get("/listings/viewAll", { params });

      const processedListings = response.data.map((listing) => {
        const primaryImage = listing.pictures.find((p) => p.is_primary);
        return { ...listing, primary_image: primaryImage };
      });

      setListings(processedListings);
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError(err.response?.data?.Location || "Failed to fetch Listings.");
    }
  };

  const fetchUserIncome = () => {
    const income = parseFloat(profile.yearly_income);
    if (!isNaN(income)) {
      setUserIncome(income);
    } else {
      console.warn("No valid income returned");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (filters.min_price > filters.max_price) {
      setError("Minimum price cannot be greater than maximum price.");
      return;
    }

    setError(null);

    const customFilters = { ...filters };
    if (latLng.lat && latLng.lng) {
      customFilters.location = filters.location.split(",")[0].trim();
    }

    fetchListings(customFilters);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    const cleared = {
      location: "",
      min_price: "",
      max_price: "",
      bedrooms: "",
      bathrooms: "",
      property_type: "",
    };
    setFilters(cleared);
    setLatLng({ lat: null, lng: null });
    setRadius("5");
    fetchListings(cleared);
  };

  useEffect(() => {
    fetchUserIncome();
  }, []);

  useEffect(() => {
    if (!location.state?.listings) {
      fetchListings();
    } else {
      const processed = location.state?.listings.map((listing) => {
        const primaryImage = listing.pictures.find((p) => p.is_primary);
        return { ...listing, primary_image: primaryImage };
      });
      setListings(processed);
    }
  }, [location.state]);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [error]);

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
          setFilters((prev) => ({
            ...prev,
            location: place.name,
          }));
          locationInputRef.current.value = place.formatted_address;
        }
      });
    }
  }, []);

  return (
    <div>
      <div className="container py-5">
        <h2 className="mb-4 text-center">🏘️ Available Listings</h2>
        {error && (
          <div ref={errorRef} className="alert alert-danger">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="card mb-5 shadow-sm">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* Location & Radius */}
                <div className="col-12">
                  <label className="form-label">Location & Radius</label>
                  <div className="input-group">
                    <input
                      type="text"
                      name="location"
                      ref={locationInputRef}
                      className="form-control"
                      defaultValue={filters.location}
                      onChange={handleInputChange}
                      required
                    />

                    <select
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

                {/* Min Price */}
                <div className="col-md-6">
                  <label className="form-label">Min Price</label>
                  <input
                    type="number"
                    name="min_price"
                    className="form-control"
                    value={filters.min_price}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>

                {/* Max Price */}
                <div className="col-md-6">
                  <label className="form-label">Max Price</label>
                  <input
                    type="number"
                    name="max_price"
                    className="form-control"
                    value={filters.max_price}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>

                {/* Property Type */}
                <div className="col-md-4">
                  <label className="form-label">Property Type</label>
                  <select
                    name="property_type"
                    className="form-select"
                    value={filters.property_type}
                    onChange={handleInputChange}
                  >
                    <option value="">Any</option>
                    <option value="H">House</option>
                    <option value="A">Apartment</option>
                    <option value="C">Condo</option>
                    <option value="T">Townhouse</option>
                    <option value="O">Other</option>
                  </select>
                </div>

                {/* Bedrooms */}
                <div className="col-md-4">
                  <label className="form-label">Bedrooms</label>
                  <input
                    type="number"
                    name="bedrooms"
                    className="form-control"
                    value={filters.bedrooms}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>

                {/* Bathrooms */}
                <div className="col-md-4">
                  <label className="form-label">Bathrooms</label>
                  <input
                    type="number"
                    name="bathrooms"
                    className="form-control"
                    value={filters.bathrooms}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="submit" className="btn btn-primary">
                  🔍 Apply Filters
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={clearFilters}
                >
                  ✨ Clear All
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Listings */}
        {listings.length === 0 ? (
          <p className="text-muted text-center">No listings found.</p>
        ) : (
          <div className="row g-4">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                income={userIncome}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Listings;
