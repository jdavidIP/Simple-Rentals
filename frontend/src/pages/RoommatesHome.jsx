import React, { useState, useEffect, useRef } from "react";
import api from "../api.js";
import { useNavigate, useLocation } from "react-router-dom";

function Roommates() {
  const [roommates, setRoommates] = useState([]);
  const [filters, setFilters] = useState({
    city: "",
    roommate_budget: "",
    gender_preference: "",
    pet_friendly: "",
    smoke_friendly: "",
    cannabis_friendly: "",
    couple_friendly: "",
    occupation: "",
  });
  const [error, setError] = useState(null);
  const errorRef = useRef(null);

  const fetchRoommates = async (customFilters = filters) => {
    try {
      const params = {};
      if (customFilters.city) params.city = customFilters.city;
      if (customFilters.roommate_budget)
        params.roommate_budget = customFilters.roommate_budget;
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
      console.log(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch roommates.");
    }
  };

  useEffect(() => {
    fetchRoommates();
    // eslint-disable-next-line
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
      roommate_budget: "",
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
              <div className="col-md-4">
                <label className="form-label">City</label>
                <input
                  type="text"
                  name="city"
                  className="form-control"
                  value={filters.city}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Budget</label>
                <input
                  type="number"
                  name="roommate_budget"
                  className="form-control"
                  value={filters.roommate_budget}
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
                  defaultValue="O"
                >
                  <option value="O">Open</option>
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
                  <label className="form-check-label" htmlFor="pet_friendly">
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
                  <label className="form-check-label" htmlFor="smoke_friendly">
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
                  <label className="form-check-label" htmlFor="couple_friendly">
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
      {roommates.length === 0 ? (
        <p className="text-muted text-center">No roommates found.</p>
      ) : (
        <div className="row g-4">
          {roommates.map((roommate) => (
            <div key={roommate.id} className="card col-3 m-4 shadow-sm">
              {roommate.profile_picture ? (
                <img
                  src={roommate.profile_picture}
                  alt="Profile"
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
                <h5 className="card-title mb-2">
                  {roommate.first_name} {roommate.last_name}
                </h5>
                <h6 className="text-primary fw-semibold mb-3">
                  Budget: ${roommate.roommate_budget}
                </h6>
                <p className="mb-2">
                  <strong>City:</strong> {roommate.user.preferred_location}
                </p>
                <p className="mb-2">
                  <strong>Move-in:</strong> {roommate.move_in_date}
                </p>
                <p className="mb-2">
                  <strong>Occupation:</strong> {roommate.occupation}
                </p>
                <p className="mb-2">
                  <strong>Gender Preference:</strong>{" "}
                  {roommate.gender_preference}
                </p>
                <p className="mb-2">
                  <strong>Pet Friendly:</strong>{" "}
                  {roommate.pet_friendly ? "Yes" : "No"}
                </p>
                <p className="mb-2">
                  <strong>Smoke Friendly:</strong>{" "}
                  {roommate.smoke_friendly ? "Yes" : "No"}
                </p>
                <p className="mb-2">
                  <strong>Cannabis Friendly:</strong>{" "}
                  {roommate.cannabis_friendly ? "Yes" : "No"}
                </p>
                <p className="mb-2">
                  <strong>Couple Friendly:</strong>{" "}
                  {roommate.couple_friendly ? "Yes" : "No"}
                </p>
                <p className="mb-2">
                  <strong>Open to Message:</strong>{" "}
                  {roommate.open_to_message ? "Yes" : "No"}
                </p>
                <p className="mb-2">
                  <strong>Description:</strong> {roommate.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Roommates;
