import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import "../styles/forms.css";
import { Link } from "react-router-dom";

function FormRegister() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    password_confirmation: "",
    profile_picture: null,
    first_name: "",
    last_name: "",
    age: "",
    sex: "",
    budget_min: "",
    budget_max: "",
    city: "",
    preferred_location: "",
    phone_number: "",
    instagram_link: "",
    facebook_link: "",
    receive_email_notifications: false,
    receive_sms_notifications: false,
    terms_accepted: false,
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === "checkbox" ? checked : type === "file" ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.budget_min === "") {
      formData.budget_min = 0;
    }

    if (formData.password !== formData.password_confirmation) {
      setError(["Passwords do not match"]);
      return;
    }

    if (Number(formData.budget_min) > Number(formData.budget_max)) {
      setError(["Minimum budget cannot be greater than maximum budget"]);
      return;
    }

    try {
      // Use FormData to handle file uploads
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });

      const response = await api.post("/register/", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 201) {
        navigate("/login");
      }
    } catch (err) {
      console.error("Error during registration:", err);

      // Check if the error response contains validation errors
      if (err.response && err.response.data) {
        const errorMessages = Object.entries(err.response.data).map(
          ([field, messages]) => `${field}: ${messages.join(", ")}`
        );
        setError(errorMessages); // Store errors as an array
      } else {
        setError(["Registration failed. Please try again."]);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h1>Register</h1>
      {error && (
        <ul style={{ color: "red" }}>
          {error.map((errMsg, index) => (
            <li key={index}>{errMsg}</li>
          ))}
        </ul>
      )}
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
        name="age"
        placeholder="Age"
        value={formData.age}
        onChange={handleChange}
        min="0"
        required
      />
      <select name="sex" value={formData.sex} onChange={handleChange} required>
        <option value="">Select your gender</option>
        <option value="M">Male</option>
        <option value="F">Female</option>
        <option value="O">Other</option>
      </select>
      <input
        type="number"
        name="budget_min"
        placeholder="Budget Min (Optional)"
        value={formData.budget_min}
        min="0"
        max={formData.budget_max - 0.01 || ""}
        step="0.01"
        onChange={handleChange}
      />
      <input
        type="number"
        name="budget_max"
        placeholder="Budget Max"
        value={formData.budget_max}
        onChange={handleChange}
        min="0"
        step="0.01"
        required
      />
      <input
        type="text"
        name="city"
        placeholder="City"
        value={formData.city}
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
      <input
        type="url"
        name="instagram_link"
        placeholder="Instagram Link"
        value={formData.instagram_link}
        onChange={handleChange}
      />
      <input
        type="url"
        name="facebook_link"
        placeholder="Facebook Link"
        value={formData.facebook_link}
        onChange={handleChange}
      />
      <input type="file" name="profile_picture" onChange={handleChange} />
      <label>
        <input
          type="checkbox"
          name="receive_email_notifications"
          checked={formData.receive_email_notifications}
          onChange={handleChange}
        />
        I would like to receive email notifications
      </label>
      <label>
        <input
          type="checkbox"
          name="receive_sms_notifications"
          checked={formData.receive_sms_notifications}
          onChange={handleChange}
        />
        I would like to receive text messages.
      </label>
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

      <div>
        <Link to="/login" className="link">
          {" "}
          Already have an acoount? Log In here!{" "}
        </Link>
      </div>
    </form>
  );
}

export default FormRegister;
