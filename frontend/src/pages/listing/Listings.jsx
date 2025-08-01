import React, { useState, useEffect, useRef } from "react";
import api from "../../api.js";
import { useLocation } from "react-router-dom";
import ListingCard from "../../components/cards/ListingCard.jsx";
import { useProfileContext } from "../../contexts/ProfileContext.jsx";
import SortDropdown from "../../components/SortDropdown.jsx";
import Pagination from "../../components/Pagination.jsx";
import useGoogleMaps from "../../hooks/useGoogleMaps";
import MultiSelectDropdown from "../../components/MultiSelectDropdown.jsx";

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
    furnished: "",
    pet_friendly: "",
    shareable: "",
    utilities: [],
    amenities: [],
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

  const AMENITY_OPTIONS = [
    { value: "ac", label: "Air Conditioning" },
    { value: "fridge", label: "Fridge" },
    { value: "heating", label: "Heating" },
    { value: "internet", label: "Internet" },
  ];

  const UTILITY_OPTIONS = [
    { value: "heat", label: "Heat" },
    { value: "hydro", label: "Hydro" },
    { value: "water", label: "Water" },
  ];

  const errorRef = useRef(null);
  const locationInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const { profile } = useProfileContext();
  const { googleMaps } = useGoogleMaps(); // load Google Maps

  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(listings.length / itemsPerPage);

  // --- Initialize Autocomplete when Google Maps loads ---
  useEffect(() => {
    if (!googleMaps) return;

    // Cleanup previous instance
    if (autocompleteRef.current) {
      googleMaps.maps.event.clearInstanceListeners(autocompleteRef.current);
      autocompleteRef.current = null;
    }

    if (locationInputRef.current) {
      autocompleteRef.current = new googleMaps.maps.places.Autocomplete(
        locationInputRef.current
      );
      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace();
        if (place.geometry && place.geometry.location) {
          const { lat, lng } = place.geometry.location;
          setLatLng({ lat: lat(), lng: lng() });
          setFilters((prev) => ({
            ...prev,
            location: place.formatted_address || place.name,
          }));
          setLocationSelected(true);
        }
      });
    }

    return () => {
      if (autocompleteRef.current) {
        googleMaps.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [googleMaps]);

  // --- Reset page on filters change ---
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, listings.length]);

  // --- Fetch User Income ---
  useEffect(() => {
    if (profile && profile.yearly_income != null) {
      const income = parseFloat(profile.yearly_income);
      setUserIncome(isNaN(income) ? null : income);
    } else {
      setUserIncome(null);
    }
  }, [profile]);

  // --- Fetch Listings API ---
  const fetchListings = async (
    customFilters = filters,
    customLatLng = latLng,
    customRadius = radius
  ) => {
    setLoadingListings(true);
    try {
      const params = { ...customFilters };
      if (customFilters.location && customLatLng.lat && customLatLng.lng) {
        params.lat = customLatLng.lat;
        params.lng = customLatLng.lng;
        params.radius = customRadius;
      } else {
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
        const monthlyIncome = userIncome / 12;
        processedListings = processedListings.filter((listing) => {
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

  // --- Initial Load ---
  useEffect(() => {
    if (!location.state?.listings) {
      fetchListings(filters, latLng, radius);
    } else {
      const processed = location.state.listings.map((listing) => {
        const primaryImage = listing.pictures?.find((p) => p.is_primary);
        return { ...listing, primary_image: primaryImage };
      });
      setListings(processed);
    }
  }, [location.state]);

  // --- Handle input changes ---
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? "true" : "") : value,
    }));

    if (name === "location" && value.trim() === "") {
      setLatLng({ lat: null, lng: null });
      setLocationSelected(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!filters.location) {
      setError("Please select a location from the dropdown.");
      return;
    }
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

  const clearFilters = () => {
    setFilters((prev) => ({
      ...prev,
      min_price: "",
      max_price: "",
      bedrooms: "",
      bathrooms: "",
      property_type: "",
      affordability: "",
      furnished: "",
      pet_friendly: "",
      shareable: "",
      amenities: [],
      utilities: [],
    }));
    setCurrentPage(1);

    if (!filters.location.trim()) {
      setListings([]);
      setError(null);
      return;
    }

    fetchListings(
      {
        ...filters,
        min_price: "",
        max_price: "",
        bedrooms: "",
        bathrooms: "",
        property_type: "",
        affordability: "",
        furnished: "",
        pet_friendly: "",
        shareable: "",
        amenities: [],
        utilities: [],
      },
      latLng,
      radius
    );
  };

  // --- Scroll error into view ---
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
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
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

                {/* Amenities, Utilities, Furnished, Pet Friendly, Roommates */}
                <div className="col-md-2">
                  <label className="form-label fw-medium">Furnished</label>
                  <select
                    name="furnished"
                    className="form-select rounded-3 shadow-sm"
                    value={filters.furnished}
                    onChange={handleInputChange}
                  >
                    <option value="">Any</option>
                    <option value={true}>Yes</option>
                    <option value={false}>No</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-medium">Pet Friendly</label>
                  <select
                    name="pet_friendly"
                    className="form-select rounded-3 shadow-sm"
                    value={filters.pet_friendly}
                    onChange={handleInputChange}
                  >
                    <option value="">Any</option>
                    <option value={true}>Yes</option>
                    <option value={false}>No</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-medium">Roommates</label>
                  <select
                    name="shareable"
                    className="form-select rounded-3 shadow-sm"
                    value={filters.shareable}
                    onChange={handleInputChange}
                  >
                    <option value="">Any</option>
                    <option value={true}>Yes</option>
                    <option value={false}>No</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <MultiSelectDropdown
                    label="Amenities"
                    options={AMENITY_OPTIONS}
                    selected={filters.amenities || []}
                    setSelected={(newSelected) =>
                      setFilters((prev) => ({
                        ...prev,
                        amenities: newSelected,
                      }))
                    }
                  />
                </div>

                <div className="col-md-3">
                  <MultiSelectDropdown
                    label="Utilities"
                    options={UTILITY_OPTIONS}
                    selected={filters.utilities || []}
                    setSelected={(newSelected) =>
                      setFilters((prev) => ({
                        ...prev,
                        utilities: newSelected,
                      }))
                    }
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

        {/* Error & Listings */}
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

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={listings.length}
              pageSize={itemsPerPage}
              onPageSizeChange={(n) => {
                setItemsPerPage(n);
                setCurrentPage(1);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default Listings;
