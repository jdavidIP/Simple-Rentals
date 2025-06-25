import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api.js";
import "../styles/forms.css";
import { Link } from "react-router-dom";

function FormRegister({ method = "register", profile }) {
  const [formData, setFormData] = useState({
    email: profile?.email || "",
    password: "",
    password_confirmation: "",
    profile_picture: null,
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    age: profile?.age || "",
    sex: profile?.sex || "",
    budget_min: profile?.budget_min || null,
    budget_max: profile?.budget_max || null,
    yearly_income: profile?.yearly_income || null,
    city: profile?.city || "",
    preferred_location: profile?.preferred_location || "",
    phone_number: profile?.phone_number || "",
    instagram_link: profile?.instagram_link || "",
    facebook_link: profile?.facebook_link || "",
    receive_email_notifications: profile?.receive_email_notifications || false,
    receive_sms_notifications: profile?.receive_sms_notifications || false,
    terms_accepted: profile?.terms_accepted || false,
  });
  const [error, setError] = useState(null);
  const [existingProfilePicture, setExistingProfilePicture] = useState(
    profile?.profile_picture || null
  );
  const [deleteProfilePicture, setDeleteProfilePicture] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        ...profile,
        password: "",
        password_confirmation: "",
        profile_picture: null,
      }));
      setExistingProfilePicture(profile.profile_picture || null);
      setDeleteProfilePicture(false);
    }
  }, [profile]);

  // Handle file input for profile picture (only one allowed)
  const handleFileInputChange = (e) => {
    const { files } = e.target;
    if (files && files[0]) {
      setFormData((prev) => ({
        ...prev,
        profile_picture: files[0],
      }));
      setExistingProfilePicture(null); // Hide old preview if uploading new
      setDeleteProfilePicture(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "profile_picture") {
      // File input handled separately
      return;
    }
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleDeleteProfilePicture = () => {
    setExistingProfilePicture(null);
    setDeleteProfilePicture(true);
    setFormData((prev) => ({
      ...prev,
      profile_picture: null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanFormData = {
      ...formData,
      budget_min: formData.budget_min === "" ? null : formData.budget_min,
      budget_max: formData.budget_max === "" ? null : formData.budget_max,
      yearly_income:
        formData.yearly_income === "" ? null : formData.yearly_income,
    };

    console.log(cleanFormData.yearly_income);

    if (formData.password !== formData.password_confirmation) {
      setError(["Passwords do not match"]);
      return;
    }

    if (Number(formData.budget_min) > Number(formData.budget_max)) {
      setError(["Minimum budget cannot be greater than maximum budget"]);
      return;
    }

    try {
      const data = new FormData();
      Object.entries(cleanFormData).forEach(([key, value]) => {
        // Don't send empty password fields on edit
        if (
          method === "edit" &&
          (key === "password" || key === "password_confirmation") &&
          !value
        ) {
          return;
        }
        // Only append the file if it's a File object
        if (key === "profile_picture") {
          if (value instanceof File) {
            data.append("profile_picture", value);
          }
        } else if (value !== undefined) {
          // If value is null, append as empty string to signal clearing the field
          data.append(key, value === null ? "" : value);
        }
      });

      // If deleting the existing profile picture, inform the backend
      if (method === "edit" && deleteProfilePicture) {
        data.append("delete_profile_picture", "true");
      }

      let response;
      if (method === "edit") {
        response = await api.patch("/edit-profile/", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (response.status === 200) {
          navigate(`/profile/${response.data.id}`);
        }
      } else {
        response = await api.post("/register/", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (response.status === 201) {
          navigate("/login");
        }
      }
    } catch (err) {
      console.error("Error during registration:", err);

      if (err.response && err.response.data) {
        const errorMessages = Object.entries(err.response.data).map(
          ([field, messages]) =>
            `${field}: ${
              Array.isArray(messages) ? messages.join(", ") : messages
            }`
        );
        setError(errorMessages);
      } else {
        setError(["Registration failed. Please try again."]);
      }
    }
  };

  // Preview for new image
  const renderNewImagePreview = () =>
    formData.profile_picture instanceof File && (
      <div className="image-container">
        <img
          src={URL.createObjectURL(formData.profile_picture)}
          alt="Preview"
          style={{ maxWidth: "150px" }}
        />
        <button
          type="button"
          className="btn btn-danger"
          onClick={() =>
            setFormData((prev) => ({
              ...prev,
              profile_picture: null,
            }))
          }
        >
          Remove
        </button>
      </div>
    );

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h1>{method === "edit" ? "Edit Profile" : "Register"}</h1>
      {error && (
        <div className="mb-3">
          <ul style={{ color: "red" }}>
            {error.map((errMsg, index) => (
              <li key={index}>{errMsg}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="mb-3">
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={method === "edit"}
        />
      </div>
      <div className="mb-3">
        <input
          type="password"
          name="password"
          placeholder={
            method === "edit"
              ? "New Password (leave blank to keep current)"
              : "Password"
          }
          value={formData.password}
          onChange={handleChange}
          required={method !== "edit"}
        />
      </div>
      <div className="mb-3">
        <input
          type="password"
          name="password_confirmation"
          placeholder={
            method === "edit" ? "Confirm New Password" : "Confirm Password"
          }
          value={formData.password_confirmation}
          onChange={handleChange}
          required={method !== "edit"}
        />
      </div>
      <div className="mb-3">
        <input
          type="text"
          name="first_name"
          placeholder="First Name"
          value={formData.first_name}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <input
          type="text"
          name="last_name"
          placeholder="Last Name"
          value={formData.last_name}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <input
          type="number"
          name="age"
          placeholder="Age"
          value={formData.age}
          onChange={handleChange}
          min="0"
          required
        />
      </div>
      <div className="mb-3">
        <select
          name="sex"
          value={formData.sex}
          onChange={handleChange}
          required
        >
          <option value="">Select your gender</option>
          <option value="M">Male</option>
          <option value="F">Female</option>
          <option value="O">Other</option>
        </select>
      </div>
      <div className="mb-3">
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
      </div>
      <div className="mb-3">
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
      </div>
      <div className="mb-3">
        <input
          type="number"
          name="yearly_income"
          placeholder="Yearly Income (Optional)"
          value={formData.yearly_income}
          onChange={handleChange}
          step="0.01"
          min="0"
        />
      </div>
      <div className="mb-3">
        <input
          type="text"
          name="city"
          placeholder="City"
          value={formData.city}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <input
          type="text"
          name="preferred_location"
          placeholder="Prefferred Location to live"
          value={formData.preferred_location}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <input
          type="text"
          name="phone_number"
          placeholder="Phone Number (e.g., +1-123-456-7890)"
          value={formData.phone_number}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <input
          type="url"
          name="instagram_link"
          placeholder="Instagram Link"
          value={formData.instagram_link}
          onChange={handleChange}
        />
      </div>
      <div className="mb-3">
        <input
          type="url"
          name="facebook_link"
          placeholder="Facebook Link"
          value={formData.facebook_link}
          onChange={handleChange}
        />
      </div>
      <div className="mb-3">
        <input
          type="file"
          name="profile_picture"
          accept="image/*"
          onChange={handleFileInputChange}
        />
        {existingProfilePicture && (
          <div className="image-container">
            <img
              src={existingProfilePicture}
              alt="Profile"
              style={{ maxWidth: "150px" }}
            />
            {method === "edit" && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteProfilePicture}
              >
                Delete
              </button>
            )}
          </div>
        )}
        {renderNewImagePreview()}
      </div>
      <div className="mb-3">
        <label>
          <input
            type="checkbox"
            name="receive_email_notifications"
            checked={formData.receive_email_notifications}
            onChange={handleChange}
          />
          I would like to receive email notifications
        </label>
      </div>
      <div className="mb-3">
        <label>
          <input
            type="checkbox"
            name="receive_sms_notifications"
            checked={formData.receive_sms_notifications}
            onChange={handleChange}
          />
          I would like to receive text messages.
        </label>
      </div>
      <div className="mb-3">
        <label>
          <input
            type="checkbox"
            name="terms_accepted"
            checked={formData.terms_accepted}
            onChange={handleChange}
            required
            disabled={method === "edit"}
          />
          I accept the terms and conditions
        </label>
      </div>
      <div className="mb-3">
        <button type="submit">
          {method === "edit" ? "Save Changes" : "Register"}
        </button>
      </div>
      {method !== "edit" && (
        <div className="mb-3">
          <Link to="/login" className="link">
            {" "}
            Already have an account? Log In here!{" "}
          </Link>
        </div>
      )}
    </form>
  );
}

export default FormRegister;
