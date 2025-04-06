import React, { useState, useEffect } from "react";
import api from "../api.js";
import { useNavigate, useLocation } from "react-router-dom";

function Listings() {
  const location = useLocation();
  const [listings, setListings] = useState(location.state?.listings || []); // State to store listings
  const [filters, setFilters] = useState({
    location: location.state?.city || "",
    min_price: "",
    max_price: "",
    bedrooms: "",
    bathrooms: "",
    property_type: "",
  }); // State to store filter values
  const [error, setError] = useState(null); // State to handle errors
  const navigate = useNavigate();

  // Fetch listings from the backend
  const fetchListings = async (customFilters = filters) => {
    try {
      const response = await api.get("/listings/viewAll", {
        params: customFilters,
      });

      const processedListings = response.data.map((listing) => {
        const primaryImage = listing.pictures.find(
          (picture) => picture.is_primary
        );
        return { ...listing, primary_image: primaryImage };
      });

      setListings(processedListings);
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError(err.response?.data?.Location || "Failed to fetch Listings.");
    }
  };

  // Handle form submission for filters
  const handleSubmit = (e) => {
    e.preventDefault();

    if (filters.min_price > filters.max_price) {
      setError("Minimum price cannot be greater than maximum price.");
    }

    fetchListings();
  };

  // Handle input changes for filters
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = {
      location: filters.location || "",
      min_price: "",
      max_price: "",
      bedrooms: "",
      bathrooms: "",
      property_type: "",
    };

    setFilters(clearedFilters); // Update the state
    fetchListings(clearedFilters); // Pass the cleared filters directly to the fetch function
  };

  // Fetch listings on component mount
  useEffect(() => {
    if (!location.state?.listings) {
      fetchListings();
    }
  }, [location.state]);

  return (
    <div className="listings-container">
      <h1>Available Listings</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Filter Form */}
      <form onSubmit={handleSubmit} className="filter-form">
        <label>
          Location:
          <input
            type="text"
            name="location"
            value={filters.location}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Min Price:
          <input
            type="number"
            name="min_price"
            value={filters.min_price}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            max={filters.max_price - 0.01 || ""}
          />
        </label>
        <label>
          Max Price:
          <input
            type="number"
            name="max_price"
            value={filters.max_price}
            onChange={handleInputChange}
            step="0.01"
            min="0"
          />
        </label>
        <label>
          Bedrooms:
          <input
            type="number"
            name="bedrooms"
            value={filters.bedrooms}
            onChange={handleInputChange}
            min="0"
          />
        </label>
        <label>
          Bathrooms:
          <input
            type="number"
            name="bathrooms"
            value={filters.bathrooms}
            onChange={handleInputChange}
            min="0"
          />
        </label>
        <label>
          Property Type:
          <select
            name="property_type"
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
        </label>
        <button type="submit" className="btn btn-primary">
          Filter
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={clearFilters}
        >
          Clear Filters
        </button>
      </form>

      {/* Listings */}
      <div className="listings">
        {listings.length === 0 ? (
          <p>No listings available.</p>
        ) : (
          listings.map((listing) => (
            <div key={listing.id} className="listing-container">
              {listing.primary_image ? (
                <img
                  src={listing.primary_image.image}
                  alt="Listing"
                  style={{ maxWidth: "300px" }}
                />
              ) : (
                <img
                  src="/static/img/placeholder.jpg"
                  alt="No Image Available"
                  style={{ maxWidth: "300px" }}
                />
              )}
              <p>
                <strong>Price:</strong> ${listing.price}
              </p>
              <p>
                <strong>Property Type:</strong> {listing.property_type_display}
              </p>
              <p>
                <strong>Bedrooms:</strong> {listing.bedrooms}
              </p>
              <p>
                <strong>Bathrooms:</strong> {listing.bathrooms}
              </p>
              <p>
                <strong>Location:</strong> {listing.street_address},{" "}
                {listing.city}
              </p>
              <p>
                <strong>Move-in Date:</strong> {listing.move_in_date}
              </p>
              <p>
                <strong>Verification Status:</strong>{" "}
                {listing.verification_status_display}
              </p>
              <p>
                <strong>Description:</strong> {listing.description}
              </p>

              <button onClick={() => navigate(`/listings/${listing.id}`)}>
                View More
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Listings;
