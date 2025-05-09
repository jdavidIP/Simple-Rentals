import React, { useState, useEffect, useRef } from "react";
import api from "../api.js";
import { useNavigate, useLocation } from "react-router-dom";

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
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const errorRef = useRef(null);

  const fetchListings = async (customFilters = filters) => {
    try {
      const response = await api.get("/listings/viewAll", {
        params: customFilters,
      });

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

  const handleStartConversation = async (listingId) => {
    try {
      const existingConversations = await api.get("/conversations/");
      const existingConversation = existingConversations.data.find(
        (conv) => String(conv.listing.id) === String(listingId)
      );

      if (existingConversation) {
        navigate(`/conversations/${existingConversation.id}`);
        return;
      }

      const response = await api.post(
        `/listing/${listingId}/start_conversation/`,
        {}
      );

      const conversationId = response.data.id;
      navigate(`/conversations/${conversationId}`);
    } catch (err) {
      if (err.response.statusText === "Unauthorized") {
        setError("Log In to start a conversation with the owner.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (filters.min_price > filters.max_price) {
      setError("Minimum price cannot be greater than maximum price.");
      return;
    }

    setError(null);
    fetchListings();
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
      location: filters.location || "",
      min_price: "",
      max_price: "",
      bedrooms: "",
      bathrooms: "",
      property_type: "",
    };
    setFilters(cleared);
    fetchListings(cleared);
  };

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

  return (
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
            {/* Location Filter */}
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  name="location"
                  className="form-control"
                  value={filters.location}
                  onChange={handleInputChange}
                  required
                />
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

      {/* Listings Results */}
      {listings.length === 0 ? (
        <p className="text-muted text-center">No listings found.</p>
      ) : (
        <div className="row g-4">
          {listings.map((listing) => (
            <div key={listing.id} className="card col-3 m-4 shadow-sm">
              {listing.primary_image ? (
                <img
                  src={listing.primary_image.image}
                  alt="Listing"
                  className="card-img-top border-2 border-bottom my-1"
                  style={{ maxHeight: "20rem", objectFit: "cover" }}
                />
              ) : (
                <img
                  src="/static/img/placeholder.jpg"
                  alt="No Image Available"
                  className="card-img-top my-1"
                  style={{ maxHeight: "20rem", objectFit: "cover" }}
                />
              )}

              <div className="card-body">
                {/* Listing Title */}
                <h5 className="card-title mb-2">
                  {listing.bedrooms} bedroom {listing.property_type} in{" "}
                  {listing.city}
                </h5>

                {/* Price */}
                <h6 className="text-primary fw-semibold mb-3">
                  ${listing.price}
                </h6>

                {/* Move-in Date */}
                <p className="mb-3">
                  <strong>Move-in:</strong> {listing.move_in_date}
                </p>

                {/* Buttons */}
                <div className="d-flex justify-content-evenly">
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => navigate(`/listings/${listing.id}`)}
                  >
                    View Details
                  </button>

                  <button
                    className="btn btn-outline-success"
                    onClick={() => handleStartConversation(listing.id)}
                  >
                    Contact Owner
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Listings;
