import React, { useState, useEffect } from "react";
import api from "../api.js";
import { useNavigate } from "react-router-dom";
import "../styles/forms.css";

function FormRoommate({ method = "post", roommate }) {
  const [formData, setFormData] = useState({
    description: roommate?.description || "",
    move_in_date: roommate?.move_in_date || "",
    stay_length: roommate?.stay_length || "",
    occupation: roommate?.occupation[0] || "",
    roommate_budget: roommate?.roommate_budget || "",
    smoke_friendly: roommate?.smoke_friendly || false,
    cannabis_friendly: roommate?.cannabis_friendly || false,
    pet_friendly: roommate?.pet_friendly || false,
    couple_friendly: roommate?.couple_friendly || false,
    gender_preference: roommate?.gender_preference[0] || "O",
    open_to_message: roommate?.open_to_message ?? true,
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    console.log(formData);

    // Clean up numeric fields (convert "" to null)
    const cleanFormData = {
      ...formData,
      roommate_budget:
        formData.roommate_budget === "" ? null : formData.roommate_budget,
      stay_length: formData.stay_length === "" ? null : formData.stay_length,
    };

    try {
      if (method === "edit" && roommate?.id) {
        // PATCH only changed fields
        await api.patch(`/roommates/edit/${roommate.id}`, cleanFormData);
        navigate(`/roommates/${roommate.id}`);
      } else {
        await api.post("/roommates/post", cleanFormData);
        navigate("/roommates");
      }
    } catch (err) {
      if (err.response && err.response.data) {
        const errorMessages = Object.values(err.response.data).flat();
        setError(errorMessages);
      } else {
        setError([
          method === "edit"
            ? "Failed to update roommate profile."
            : "Failed to register roommate profile.",
        ]);
      }
    }
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      <h1>
        {method === "edit"
          ? "Edit Roommate Profile"
          : "Roommate Profile Registration"}
      </h1>
      {error && (
        <ul>
          {error.map((msg, idx) => (
            <li key={idx}>{msg}</li>
          ))}
        </ul>
      )}
      <div className="mb-3">
        <label>Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label>Move-in Date</label>
        <input
          type="date"
          name="move_in_date"
          value={formData.move_in_date}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label>Stay Length (months)</label>
        <input
          type="number"
          name="stay_length"
          value={formData.stay_length}
          onChange={handleChange}
          min="1"
          required
        />
      </div>
      <div className="mb-3">
        <label>Occupation</label>
        <select
          name="occupation"
          value={formData.occupation[0]}
          onChange={handleChange}
          required
        >
          <option value="">Select</option>
          <option value="S">Student</option>
          <option value="E">Employed</option>
          <option value="N">Not Currently Working</option>
        </select>
      </div>
      <div className="mb-3">
        <label>Budget</label>
        <input
          type="number"
          name="roommate_budget"
          value={formData.roommate_budget}
          onChange={handleChange}
          min="0"
          required
        />
      </div>
      <div className="mb-3">
        <label>Gender Preference</label>
        <select
          name="gender_preference"
          value={formData.gender_preference[0]}
          onChange={handleChange}
          required
        >
          <option value="O">Open</option>
          <option value="F">Female</option>
          <option value="M">Male</option>
        </select>
      </div>
      <div className="mb-3">
        <label>
          <input
            type="checkbox"
            name="pet_friendly"
            checked={formData.pet_friendly}
            onChange={handleChange}
          />
          Pet Friendly
        </label>
        <label>
          <input
            type="checkbox"
            name="smoke_friendly"
            checked={formData.smoke_friendly}
            onChange={handleChange}
          />
          Smoke Friendly
        </label>
        <label>
          <input
            type="checkbox"
            name="cannabis_friendly"
            checked={formData.cannabis_friendly}
            onChange={handleChange}
          />
          Cannabis Friendly
        </label>
        <label>
          <input
            type="checkbox"
            name="couple_friendly"
            checked={formData.couple_friendly}
            onChange={handleChange}
          />
          Couple Friendly
        </label>
        <label>
          <input
            type="checkbox"
            name="open_to_message"
            checked={formData.open_to_message}
            onChange={handleChange}
          />
          Open to Message
        </label>
      </div>
      <button type="submit">
        {method === "edit" ? "Save Changes" : "Register Roommate Profile"}
      </button>
    </form>
  );
}

export default FormRoommate;
