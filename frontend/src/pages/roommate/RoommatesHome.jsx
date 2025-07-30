import React, { useState, useEffect, useRef } from "react";
import api from "../../api.js";
import { useNavigate } from "react-router-dom";
import Pagination from "../../components/Pagination.jsx";
import RoommateCard from "../../components/cards/RoommateCard.jsx";

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
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const ITEMS_PER_PAGE = 15;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(roommates.length / ITEMS_PER_PAGE);

  const errorRef = useRef(null);
  const cityInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Slice roommates by current page
  const paginatedRoommates = roommates.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 whenever filters or data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, roommates.length]);

  // Google Places Autocomplete
  const initializeAutocomplete = () => {
    if (
      window.google &&
      window.google.maps &&
      window.google.maps.places &&
      cityInputRef.current
    ) {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(
          autocompleteRef.current
        );
      }
      const options = { types: ["(cities)"] };
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
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
  };

  useEffect(() => {
    let checkInterval = setInterval(() => {
      if (
        window.google &&
        window.google.maps &&
        window.google.maps.places &&
        cityInputRef.current
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
  }, []);

  useEffect(() => {
    if (
      window.google &&
      window.google.maps &&
      window.google.maps.places &&
      cityInputRef.current &&
      filters.city === ""
    ) {
      initializeAutocomplete();
    }
  }, [filters.city]);

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
      if (customFilters.pet_friendly)
        params.pet_friendly = customFilters.pet_friendly;
      if (customFilters.smoke_friendly)
        params.smoke_friendly = customFilters.smoke_friendly;
      if (customFilters.cannabis_friendly)
        params.cannabis_friendly = customFilters.cannabis_friendly;
      if (customFilters.couple_friendly)
        params.couple_friendly = customFilters.couple_friendly;
      if (customFilters.occupation)
        params.occupation = customFilters.occupation;

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
      <h2 className="mb-4 text-center">👥 Available Roommates</h2>

      {error ? (
        <div ref={errorRef} className="alert alert-danger">
          {error}
        </div>
      ) : loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="card mb-5 shadow-sm">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      name="city"
                      className="form-control"
                      value={filters.city}
                      onChange={handleInputChange}
                      ref={cityInputRef}
                      placeholder="Type a city..."
                      autoComplete="off"
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Budget Min</label>
                    <input
                      type="number"
                      name="budget_min"
                      className="form-control"
                      value={filters.budget_min}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Budget Max</label>
                    <input
                      type="number"
                      name="budget_max"
                      className="form-control"
                      value={filters.budget_max}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Gender Preference</label>
                    <select
                      name="gender_preference"
                      className="form-select"
                      value={filters.gender_preference}
                      onChange={handleInputChange}
                    >
                      <option value="">Open</option>
                      <option value="F">Female</option>
                      <option value="M">Male</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Occupation</label>
                    <select
                      name="occupation"
                      className="form-select"
                      value={filters.occupation}
                      onChange={handleInputChange}
                    >
                      <option value="">Any</option>
                      <option value="S">Student</option>
                      <option value="E">Employed</option>
                      <option value="N">Not Currently Working</option>
                    </select>
                  </div>
                  <div className="col-md-4 d-flex align-items-center">
                    <div className="form-check me-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="pet_friendly"
                        id="pet_friendly"
                        checked={filters.pet_friendly === "true"}
                        onChange={handleInputChange}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="pet_friendly"
                      >
                        Pet Friendly
                      </label>
                    </div>
                    <div className="form-check me-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="smoke_friendly"
                        id="smoke_friendly"
                        checked={filters.smoke_friendly === "true"}
                        onChange={handleInputChange}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="smoke_friendly"
                      >
                        Smoke Friendly
                      </label>
                    </div>
                    <div className="form-check me-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="cannabis_friendly"
                        id="cannabis_friendly"
                        checked={filters.cannabis_friendly === "true"}
                        onChange={handleInputChange}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="cannabis_friendly"
                      >
                        Cannabis Friendly
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="couple_friendly"
                        id="couple_friendly"
                        checked={filters.couple_friendly === "true"}
                        onChange={handleInputChange}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="couple_friendly"
                      >
                        Couple Friendly
                      </label>
                    </div>
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

          {/* Roommates List */}
          {paginatedRoommates.length === 0 ? (
            <p className="text-muted text-center">No roommates found.</p>
          ) : (
            <div className="row gx-4 gy-4">
              {paginatedRoommates.map((roommate) => (
                <RoommateCard key={roommate.id} roommate={roommate} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Roommates;
