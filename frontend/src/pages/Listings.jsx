import React, { useState, useEffect } from "react";
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
      // Check if a conversation already exists for this listing
      const existingConversations = await api.get("/conversations/");
      const existingConversation = existingConversations.data.find(
        (conv) => String(conv.listing.id) === String(listingId)
      );
  
      if (existingConversation) {
        navigate(`/conversations/${existingConversation.id}`);
        return;
      }
  
      // If not found, create a new conversation
      const response = await api.post(
        `/listing/${listingId}/start_conversation/`,
        {}
      );
  
      const conversationId = response.data.id;
      navigate(`/conversations/${conversationId}`);
    } catch (err) {
      console.error("Error starting conversation:", err);
      setError("An unexpected error occurred. Please try again.");
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

  return (
    <div>
      <Header />
      <div class="container py-5">
        <h2 class="mb-4 text-center">🏘️ Available Listings</h2>
        {error && <div class="alert alert-danger">{error}</div>}

        {/* Filters */}
        <div class="card mb-5 shadow-sm">
          <div class="card-body">
            <form onSubmit={handleSubmit}>
              {/* Location Filter */}
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label">Location</label>
                  <input
                    type="text"
                    name="location"
                    class="form-control"
                    value={filters.location}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Min Price */}
                <div class="col-md-6">
                  <label class="form-label">Min Price</label>
                  <input
                    type="number"
                    name="min_price"
                    class="form-control"
                    value={filters.min_price}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>

                {/* Max Price */}
                <div class="col-md-6">
                  <label class="form-label">Max Price</label>
                  <input
                    type="number"
                    name="max_price"
                    class="form-control"
                    value={filters.max_price}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>

                {/* Property Type */}
                <div class="col-md-4">
                  <label class="form-label">Property Type</label>
                  <select
                    name="property_type"
                    class="form-select"
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
                <div class="col-md-4">
                  <label class="form-label">Bedrooms</label>
                  <input
                    type="number"
                    name="bedrooms"
                    class="form-control"
                    value={filters.bedrooms}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>

                {/* Bathrooms */}
                <div class="col-md-4">
                  <label class="form-label">Bathrooms</label>
                  <input
                    type="number"
                    name="bathrooms"
                    class="form-control"
                    value={filters.bathrooms}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="submit" class="btn btn-primary">
                  🔍 Apply Filters
                </button>
                <button
                  type="button"
                  class="btn btn-secondary"
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
          <p class="text-muted text-center">No listings found.</p>
        ) : (
          <div class="row g-4">
            {listings.map((listing) => (
              <div key={listing.id} class="card col-3 m-4 shadow-sm">
                {listing.primary_image ? (
                  <img
                    src={listing.primary_image.image}
                    alt="Listing"
                    class="card-img-top border-2 border-bottom my-1" 
                    style={{ maxheight: "20rem", objectFit: "cover" }}
                  />
                ) : (
                  <img
                    src="/static/img/placeholder.jpg"
                    alt="No Image Available"
                    class="card-img-top my-1"
                    style={{ maxheight: "20rem", objectFit: "cover" }}
                  />
                )}

                <div class="card-body">
                  {/* Listing Title */}
                  <h5 class="card-title mb-2">
                    {listing.bedrooms} bedroom {listing.property_type} in {listing.city}
                  </h5>

                  {/* Price */}
                  <h6 class="text-primary fw-semibold mb-3">
                    ${listing.price}
                  </h6>

                  {/* Move-in Date */}
                  <p class="mb-3">
                    <strong>Move-in:</strong> {listing.move_in_date}
                  </p>

                  {/* Buttons */}
                  <div class="d-flex justify-content-evenly">
                    <button
                      class="btn btn-outline-primary"
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
      <Footer />
    </div>
  );
}

export default Listings;
