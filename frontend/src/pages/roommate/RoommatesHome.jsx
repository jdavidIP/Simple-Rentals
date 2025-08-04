import React, { useState, useEffect, useRef } from "react";
import api from "../../api.js";
import Pagination from "../../components/Pagination.jsx";
import RoommateCard from "../../components/cards/RoommateCard.jsx";
import useGoogleMaps from "../../hooks/useGoogleMaps";
import MultiSelectDropdown from "../../components/MultiSelectDropdown.jsx";
import "../../styles/listings.css";

function Roommates() {
  const [roommates, setRoommates] = useState([]);
  const [filters, setFilters] = useState({
    city: "",
    budget_min: "",
    budget_max: "",
    gender_preference: "",
    pet_friendly: "",
    smoke_friendly: "",
    cannabis_friendly: "",
    couple_friendly: "",
    occupation: "",
    gender: "",
    preferences: [],
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(roommates.length / itemsPerPage);

  const errorRef = useRef(null);
  const cityInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const { googleMaps } = useGoogleMaps(); // Load Google Maps

  const PREFERENCES_OPTIONS = [
    { value: "pet_friendly", label: "Pet Friendly" },
    { value: "smoke_friendly", label: "Smoke Friendly" },
    { value: "cannabis_friendly", label: "Cannabis Friendly" },
    { value: "couple_friendly", label: "Couple Friendly" },
  ];

  // Slice roommates by current page
  const paginatedRoommates = roommates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 whenever filters or data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, roommates.length]);

  // Initialize Autocomplete when googleMaps loads
  useEffect(() => {
    if (!googleMaps) return;

    if (autocompleteRef.current) {
      googleMaps.maps.event.clearInstanceListeners(autocompleteRef.current);
      autocompleteRef.current = null;
    }

    if (cityInputRef.current) {
      const options = { types: ["(cities)"] };
      autocompleteRef.current = new googleMaps.maps.places.Autocomplete(
        cityInputRef.current,
        options
      );
      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace();
        const cityName =
          place.address_components?.find((c) => c.types.includes("locality"))
            ?.long_name ||
          place.address_components?.find((c) =>
            c.types.includes("administrative_area_level_1")
          )?.long_name ||
          place.name ||
          "";
        setFilters((prev) => ({
          ...prev,
          city: cityName,
        }));
      });
    }

    return () => {
      if (autocompleteRef.current) {
        googleMaps.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [googleMaps]);

  // Fetch Roommates API
  const fetchRoommates = async (customFilters = filters) => {
    setLoading(true);
    try {
      const params = {};
      if (customFilters.city) params.preferred_location = customFilters.city;
      if (customFilters.budget_min)
        params.budget_min = customFilters.budget_min;
      if (customFilters.budget_max)
        params.budget_max = customFilters.budget_max;
      if (customFilters.gender_preference)
        params.gender_preference = customFilters.gender_preference;
      if (customFilters.preferences.length > 0)
        params.preferences = customFilters.preferences;
      if (customFilters.occupation)
        params.occupation = customFilters.occupation;
      if (customFilters.gender) params.gender = customFilters.gender;

      const response = await api.get("/roommates/", { params });
      setRoommates(response.data);
      setCurrentPage(1);
      setError(null);
    } catch (err) {
      setError("Failed to fetch roommates.");
      setRoommates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoommates();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? "true" : "") : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchRoommates(filters);
  };

  const clearFilters = () => {
    const cleared = {
      city: "",
      budget_min: "",
      budget_max: "",
      gender_preference: "",
      pet_friendly: "",
      smoke_friendly: "",
      cannabis_friendly: "",
      couple_friendly: "",
      occupation: "",
      gender: "",
      preferences: [],
    };
    setFilters(cleared);
    fetchRoommates(cleared);
  };

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [error]);

  return (
    <div className="container py-5">
      <h2 className="mb-5 text-center fw-bold display-6">
        👥 Find Your Ideal Roommate
      </h2>

      {/* Filters Section */}
      <div className="card mb-5 border-0 shadow-lg rounded-4">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              <div className="col-md-4">
                <label className="form-label fw-medium">City</label>
                <input
                  type="text"
                  name="city"
                  className="form-control rounded-3 shadow-sm"
                  value={filters.city}
                  onChange={handleInputChange}
                  ref={cityInputRef}
                  placeholder="Type a city..."
                  autoComplete="off"
                />
              </div>
              <div className="col-md-2">
                <label className="form-label fw-medium">Budget Min</label>
                <input
                  type="number"
                  name="budget_min"
                  className="form-control rounded-3 shadow-sm"
                  value={filters.budget_min}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="col-md-2">
                <label className="form-label fw-medium">Budget Max</label>
                <input
                  type="number"
                  name="budget_max"
                  className="form-control rounded-3 shadow-sm"
                  value={filters.budget_max}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-medium">Gender</label>
                <select
                  name="gender"
                  className="form-select rounded-3 shadow-sm"
                  value={filters.gender}
                  onChange={handleInputChange}
                >
                  <option value="">Any</option>
                  <option value="O">Other</option>
                  <option value="F">Female</option>
                  <option value="M">Male</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-medium">Occupation</label>
                <select
                  name="occupation"
                  className="form-select rounded-3 shadow-sm"
                  value={filters.occupation}
                  onChange={handleInputChange}
                >
                  <option value="">Any</option>
                  <option value="S">Student</option>
                  <option value="E">Employed</option>
                  <option value="N">Not Currently Working</option>
                </select>
              </div>
              <div className="col-md-4">
                <MultiSelectDropdown
                  label="Preferences"
                  options={PREFERENCES_OPTIONS}
                  selected={filters.preferences || []}
                  setSelected={(newSelected) =>
                    setFilters((prev) => ({
                      ...prev,
                      preferences: newSelected,
                    }))
                  }
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-medium">
                  Gender Preference
                </label>
                <select
                  name="gender_preference"
                  className="form-select rounded-3 shadow-sm"
                  value={filters.gender_preference}
                  onChange={handleInputChange}
                >
                  <option value="">Any</option>
                  <option value="O">Open</option>
                  <option value="F">Female</option>
                  <option value="M">Male</option>
                </select>
              </div>
            </div>
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

      {error ? (
        <div ref={errorRef} className="alert alert-danger shadow-sm">
          {error}
        </div>
      ) : loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <>
          {/* Roommates List */}
          {paginatedRoommates.length === 0 ? (
            <p className="text-muted text-center fs-5">No roommates found.</p>
          ) : (
            <div className="row roommates-grid">
              {paginatedRoommates.map((roommate) => (
                <div className="col-md-4" key={roommate.id}>
                  <RoommateCard
                    key={roommate.id}
                    roommate={roommate}
                    styling={true}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={roommates.length}
            pageSize={itemsPerPage}
            onPageSizeChange={(n) => {
              setItemsPerPage(n);
              setCurrentPage(1);
            }}
          />
        </>
      )}
    </div>
  );
}

export default Roommates;
