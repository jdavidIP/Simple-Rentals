import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../../api.js";
import { useLocation } from "react-router-dom";
import ListingCard from "../../components/cards/ListingCard.jsx";
import { useProfileContext } from "../../contexts/ProfileContext.jsx";
import SortDropdown from "../../components/SortDropdown.jsx";
import Pagination from "../../components/Pagination.jsx";

function Listings() {
  const location = useLocation();
  const [listings, setListings] = useState(location.state?.listings || []);
  const [sortOption, setSortOption] = useState("newest");
  const [filters, setFilters] = useState({
    location: location.state?.city || "",
    min_price: "",
    max_price: "",
    bedrooms: "",
    bathrooms: "",
    property_type: "",
    affordability: "",
  });
  const [latLng, setLatLng] = useState(
    location.state?.latLng || { lat: null, lng: null }
  );
  const [radius, setRadius] = useState(location.state?.radius || "5");
  const [error, setError] = useState(null);
  const [loadingListings, setLoadingListings] = useState(false);
  const [userIncome, setUserIncome] = useState(null);
  const [locationSelected, setLocationSelected] = useState(
    location.state?.locationSelected || false
  );

  const errorRef = useRef(null);
  const locationInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const { profile } = useProfileContext();

  const ITEMS_PER_PAGE = 15;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(listings.length / ITEMS_PER_PAGE);

  // --- Google Places Autocomplete initialization ---
  const initializeAutocomplete = useCallback(() => {
    if (
      window.google &&
      window.google.maps &&
      window.google.maps.places &&
      locationInputRef.current
    ) {
      // If already attached to the current input, skip
      if (
        autocompleteRef.current &&
        autocompleteRef.current.inputElement === locationInputRef.current
      ) {
        return;
      }
      // Remove any existing autocomplete
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(
          autocompleteRef.current
        );
        autocompleteRef.current = null;
      }
      // Attach autocomplete
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        locationInputRef.current
      );
      autocompleteRef.current.inputElement = locationInputRef.current;
      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace();
        if (place.geometry && place.geometry.location) {
          const { lat, lng } = place.geometry.location;
          setLatLng({
            lat: lat(),
            lng: lng(),
          });
          setFilters((prev) => ({
            ...prev,
            location: place.formatted_address || place.name,
          }));
          setLocationSelected(true);
        }
      });
    }
  }, []);

  // --- Init autocomplete after Google API loads and input mounts ---
  useEffect(() => {
    let checkInterval = setInterval(() => {
      if (
        window.google &&
        window.google.maps &&
        window.google.maps.places &&
        locationInputRef.current
      ) {
        initializeAutocomplete();
        clearInterval(checkInterval);
      }
    }, 100);

    return () => {
      clearInterval(checkInterval);
      if (autocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(
          autocompleteRef.current
        );
      }
    };
  }, [initializeAutocomplete]);

  // --- Always re-initialize autocomplete when input is focused ---
  const handleLocationFocus = () => {
    initializeAutocomplete();
  };

  // --- If location field is cleared, reset selected state ---
  useEffect(() => {
    if (
      window.google &&
      window.google.maps &&
      window.google.maps.places &&
      locationInputRef.current &&
      filters.location === ""
    ) {
      initializeAutocomplete();
      setLocationSelected(false);
      setLatLng({ lat: null, lng: null });
    }
    // eslint-disable-next-line
  }, [filters.location, initializeAutocomplete]);

  // --- Fetch User Income ---
  useEffect(() => {
    if (profile && profile.yearly_income != null) {
      const income = parseFloat(profile.yearly_income);
      setUserIncome(isNaN(income) ? null : income);
    } else {
      setUserIncome(null);
    }
  }, [profile]);

  // --- Fetch Listings API with geo params ---
  const fetchListings = async (
    customFilters = filters,
    customLatLng = latLng,
    customRadius = radius
  ) => {
    setLoadingListings(true);
    try {
      const params = { ...customFilters };
      // Only add geo params if location is picked & has latLng
      if (customFilters.location && customLatLng.lat && customLatLng.lng) {
        params.lat = customLatLng.lat;
        params.lng = customLatLng.lng;
        params.radius = customRadius;
      } else {
        // Remove geo params if present
        delete params.lat;
        delete params.lng;
        delete params.radius;
      }
      const response = await api.get("/listings/viewAll", { params });
      let processedListings = response.data.map((listing) => {
        const primaryImage = listing.pictures?.find((p) => p.is_primary);
        return { ...listing, primary_image: primaryImage };
      });

      if (customFilters.affordability && userIncome) {
        processedListings = processedListings.filter((listing) => {
          const monthlyIncome = userIncome / 12;
          switch (customFilters.affordability) {
            case "affordable":
              return listing.price <= monthlyIncome * 0.25;
            case "recommended":
              return (
                listing.price > monthlyIncome * 0.25 &&
                listing.price <= monthlyIncome * 0.4
              );
            case "tooExpensive":
              return listing.price > monthlyIncome * 0.4;
            default:
              return true;
          }
        });
      }

      setListings(processedListings);
      setCurrentPage(1);
      setError(null);
    } catch (err) {
      setError("Failed to fetch listings.");
      setListings([]);
    } finally {
      setLoadingListings(false);
    }
  };

  // --- Initial load: use listings from navigation or fetch ---
  useEffect(() => {
    if (!location.state?.listings) {
      fetchListings(filters, latLng, radius);
    } else {
      const processed = location.state?.listings.map((listing) => {
        const primaryImage = listing.pictures?.find((p) => p.is_primary);
        return { ...listing, primary_image: primaryImage };
      });
      setListings(processed);
    }
    // eslint-disable-next-line
  }, [location.state]);

  // --- Input change handling ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (name === "location") {
      if (value.trim() === "") {
        setLatLng({ lat: null, lng: null });
        setLocationSelected(false);
      } else {
        setLocationSelected(false);
      }
    }
  };

  // --- Only allow submit if location is selected---
  const handleSubmit = (e) => {
    e.preventDefault();
    // Block if no location
    if (!filters.location) {
      setError("Please select a location from the dropdown.");
      return;
    }
    // Block if location typed but not picked
    if (!locationSelected) {
      setError("Please select a location from the dropdown.");
      return;
    }
    if (
      filters.min_price &&
      filters.max_price &&
      Number(filters.min_price) > Number(filters.max_price)
    ) {
      setError("Minimum price cannot be greater than maximum price.");
      return;
    }
    setError(null);
    fetchListings({ ...filters }, latLng, radius);
  };

  // --- Only reset filter fields ---
  const clearFilters = () => {
    // Clear only the non-location fields
    setFilters((prev) => ({
      ...prev,
      min_price: "",
      max_price: "",
      bedrooms: "",
      bathrooms: "",
      property_type: "",
      affordability: "",
    }));

    setCurrentPage(1);

    // If location field is empty, just clear filters and listings
    if (!filters.location.trim()) {
      setListings([]);
      setError(null);
      return;
    }

    // If location is still present, fetch filtered listings
    fetchListings(
      {
        ...filters,
        min_price: "",
        max_price: "",
        bedrooms: "",
        bathrooms: "",
        property_type: "",
        affordability: "",
      },
      latLng,
      radius
    );
  };

  // --- Error scroll into view ---
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [error]);

  const sortedListings = [...listings].sort((a, b) => {
    switch (sortOption) {
      case "newest":
        return new Date(b.created_at) - new Date(a.created_at);
      case "oldest":
        return new Date(a.created_at) - new Date(b.created_at);
      case "priceLowHigh":
        return a.price - b.price;
      case "priceHighLow":
        return b.price - a.price;
      default:
        return 0;
    }
  });

  const paginatedListings = sortedListings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div>
      <div className="container py-5">
        <h2 className="mb-5 text-center fw-bold display-6">
          🏘️ Find Your Ideal Rental
        </h2>

        {/* Filters */}
        <div className="card mb-5 border-0 shadow-lg rounded-4">
          <div className="card-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* Location & Radius */}
                <div className="col-12">
                  <label
                    htmlFor="location-input"
                    className="form-label fw-medium"
                  >
                    Location & Radius
                  </label>
                  <div className="input-group">
                    <input
                      id="location-input"
                      type="text"
                      name="location"
                      ref={locationInputRef}
                      className="form-control rounded-3 shadow-sm"
                      value={filters.location}
                      onChange={handleInputChange}
                      onFocus={handleLocationFocus}
                      placeholder="Type a location..."
                      autoComplete="off"
                      aria-label="Location"
                    />
                    <select
                      className="form-select"
                      style={{ maxWidth: "140px" }}
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
                  {filters.location && !locationSelected && (
                    <small className="text-danger">
                      Please select a location from the dropdown.
                    </small>
                  )}
                </div>

                {/* Price Range */}
                <div className="col-md-4">
                  <label className="form-label fw-medium">Min Price</label>
                  <input
                    type="number"
                    name="min_price"
                    className="form-control rounded-3 shadow-sm"
                    value={filters.min_price}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="e.g. 500"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-medium">Max Price</label>
                  <input
                    type="number"
                    name="max_price"
                    className="form-control rounded-3 shadow-sm"
                    value={filters.max_price}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="e.g. 2000"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-medium">Affordability</label>
                  <select
                    name="affordability"
                    className="form-select rounded-3 shadow-sm"
                    value={filters.affordability}
                    onChange={handleInputChange}
                  >
                    <option value="">Any</option>
                    <option value="affordable">Affordable</option>
                    <option value="recommended">Recommended</option>
                    <option value="tooExpensive">Too Expensive</option>
                  </select>
                </div>

                {/* Property Info */}
                <div className="col-md-4">
                  <label className="form-label fw-medium">Property Type</label>
                  <select
                    name="property_type"
                    className="form-select rounded-3 shadow-sm"
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
                <div className="col-md-4">
                  <label className="form-label fw-medium">Bedrooms</label>
                  <input
                    type="number"
                    name="bedrooms"
                    className="form-control rounded-3 shadow-sm"
                    value={filters.bedrooms}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="Any"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-medium">Bathrooms</label>
                  <input
                    type="number"
                    name="bathrooms"
                    className="form-control rounded-3 shadow-sm"
                    value={filters.bathrooms}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="Any"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!filters.location.trim() || !locationSelected}
                  title={
                    filters.location && !locationSelected
                      ? "Please select a location from the dropdown"
                      : !filters.location.trim()
                      ? "Please enter and select a location"
                      : ""
                  }
                >
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

        {error ? (
          <div ref={errorRef} className="alert alert-danger">
            {error}
          </div>
        ) : loadingListings ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border text-primary" role="status" />
          </div>
        ) : (
          <>
            <SortDropdown
              sortOption={sortOption}
              setSortOption={setSortOption}
            />

            {/* Listings */}
            {paginatedListings.length === 0 ? (
              <p className="text-muted text-center">No listings found.</p>
            ) : (
              <div className="row gx-3">
                {paginatedListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    income={userIncome}
                  />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Listings;
