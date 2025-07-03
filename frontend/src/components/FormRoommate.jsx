import React, { useState } from "react";
import api from "../api.js";
import { useNavigate } from "react-router-dom";
import "../styles/forms.css";

function FormRoommate({ method = "post", roommate }) {
  const [formData, setFormData] = useState({
    description: roommate?.description || "",
    move_in_date: roommate?.move_in_date || "",
    stay_length: roommate?.stay_length ?? "",
    occupation: roommate?.occupation || "",
    roommate_budget: roommate?.roommate_budget ?? "",
    smoke_friendly: roommate?.smoke_friendly ?? false,
    cannabis_friendly: roommate?.cannabis_friendly ?? false,
    pet_friendly: roommate?.pet_friendly ?? false,
    couple_friendly: roommate?.couple_friendly ?? false,
    gender_preference: roommate?.gender_preference || "O",
    open_to_message: roommate?.open_to_message ?? true,
  });
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();

  function validateFields(data) {
    const errors = {};
    if (!data.description || data.description.length < 15)
      errors.description = "Description should be at least 15 characters.";
    if (!data.move_in_date)
      errors.move_in_date = "Move-in date is required.";
    if (!data.stay_length || Number(data.stay_length) < 1)
      errors.stay_length = "Stay length must be at least 1 month.";
    if (!["S", "E", "N"].includes(data.occupation))
      errors.occupation = "Please select occupation.";
    if (!data.roommate_budget || Number(data.roommate_budget) < 1)
      errors.roommate_budget = "Budget must be at least 1.";
    if (!["O", "M", "F"].includes(data.gender_preference))
      errors.gender_preference = "Please select gender preference.";
    return errors;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData((prev) => {
      const updated = { ...prev, [name]: newValue };
      setFieldErrors(validateFields(updated)); // live validate
      return updated;
    });
  };

  const handleBlur = (e) => {
    setTouched((prev) => ({
      ...prev,
      [e.target.name]: true,
    }));
  };

  const errMsg = (name) =>
    touched[name] && fieldErrors[name] ? (
      <div className="field-error">{fieldErrors[name]}</div>
    ) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate all before submit
    const validationErrors = validateFields(formData);
    setFieldErrors(validationErrors);
    setTouched(Object.keys(formData).reduce((obj, k) => ({ ...obj, [k]: true }), {}));
    if (Object.keys(validationErrors).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const cleanFormData = {
      ...formData,
      roommate_budget:
        formData.roommate_budget === "" ? null : Number(formData.roommate_budget),
      stay_length: formData.stay_length === "" ? null : Number(formData.stay_length),
    };

    try {
      if (method === "edit" && roommate?.id) {
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
    <form className="form-container" onSubmit={handleSubmit} autoComplete="off">
      <h1>
        {method === "edit"
          ? "Edit Roommate Profile"
          : "Roommate Profile Registration"}
      </h1>
      {error && (
        <ul className="error-list">
          {error.map((msg, idx) => (
            <li key={idx}>{msg}</li>
          ))}
        </ul>
      )}
      <div className="mb-3">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          onBlur={handleBlur}
          required
        />
        {errMsg("description")}
      </div>
      <div className="mb-3">
        <label htmlFor="move_in_date">Move-in Date</label>
        <input
          type="date"
          id="move_in_date"
          name="move_in_date"
          value={formData.move_in_date}
          onChange={handleChange}
          onBlur={handleBlur}
          required
        />
        {errMsg("move_in_date")}
      </div>
      <div className="mb-3">
        <label htmlFor="stay_length">Stay Length (months)</label>
        <input
          type="number"
          id="stay_length"
          name="stay_length"
          value={formData.stay_length}
          onChange={handleChange}
          onBlur={handleBlur}
          min="1"
          required
        />
        {errMsg("stay_length")}
      </div>
      <div className="mb-3">
        <label htmlFor="occupation">Occupation</label>
        <select
          id="occupation"
          name="occupation"
          value={formData.occupation}
          onChange={handleChange}
          onBlur={handleBlur}
          required
        >
          <option value="">Select</option>
          <option value="S">Student</option>
          <option value="E">Employed</option>
          <option value="N">Not Currently Working</option>
        </select>
        {errMsg("occupation")}
      </div>
      <div className="mb-3">
        <label htmlFor="roommate_budget">Budget</label>
        <input
          type="number"
          id="roommate_budget"
          name="roommate_budget"
          value={formData.roommate_budget}
          onChange={handleChange}
          onBlur={handleBlur}
          min="0"
          required
        />
        {errMsg("roommate_budget")}
      </div>
      <div className="mb-3">
        <label htmlFor="gender_preference">Gender Preference</label>
        <select
          id="gender_preference"
          name="gender_preference"
          value={formData.gender_preference}
          onChange={handleChange}
          onBlur={handleBlur}
          required
        >
          <option value="O">Open</option>
          <option value="F">Female</option>
          <option value="M">Male</option>
        </select>
        {errMsg("gender_preference")}
      </div>
      <div className="mb-3">
        <label>
          <input
            type="checkbox"
            name="pet_friendly"
            checked={formData.pet_friendly}
            onChange={handleChange}
          />{" "}
          Pet Friendly
        </label>
        {"  "}
        <label>
          <input
            type="checkbox"
            name="smoke_friendly"
            checked={formData.smoke_friendly}
            onChange={handleChange}
          />{" "}
          Smoke Friendly
        </label>
        {"  "}
        <label>
          <input
            type="checkbox"
            name="cannabis_friendly"
            checked={formData.cannabis_friendly}
            onChange={handleChange}
          />{" "}
          Cannabis Friendly
        </label>
        {"  "}
        <label>
          <input
            type="checkbox"
            name="couple_friendly"
            checked={formData.couple_friendly}
            onChange={handleChange}
          />{" "}
          Couple Friendly
        </label>
        {"  "}
        <label>
          <input
            type="checkbox"
            name="open_to_message"
            checked={formData.open_to_message}
            onChange={handleChange}
          />{" "}
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
