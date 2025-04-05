import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";

function FormRegister({ method }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    password_confirmation: "",
    first_name: "",
    last_name: "",
    budget_min: "",
    budget_max: "",
    phone_number: "",
    terms_accepted: false,
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirmation) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await api.post("/register/", formData);
      if (response.status === 201) {
        navigate("/login");
      }
    } catch (err) {
      console.error("Error during registration:", err);
      setError("Registration failed. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h1>Register</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        required
      />
      <input
        type="password"
        name="password_confirmation"
        placeholder="Confirm Password"
        value={formData.password_confirmation}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="first_name"
        placeholder="First Name"
        value={formData.first_name}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="last_name"
        placeholder="Last Name"
        value={formData.last_name}
        onChange={handleChange}
        required
      />
      <input
        type="number"
        name="budget_min"
        placeholder="Budget Min (Optional)"
        value={formData.budget_min}
        onChange={handleChange}
      />
      <input
        type="number"
        name="budget_max"
        placeholder="Budget Max"
        value={formData.budget_max}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="phone_number"
        placeholder="Phone Number (e.g., +1-123-456-7890)"
        value={formData.phone_number}
        onChange={handleChange}
        required
      />
      <label>
        <input
          type="checkbox"
          name="terms_accepted"
          checked={formData.terms_accepted}
          onChange={handleChange}
          required
        />
        I accept the terms and conditions
      </label>
      <button type="submit">Register</button>
    </form>
  );
}

export default FormRegister;
