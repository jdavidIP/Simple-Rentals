import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api.js";
import "../../styles/forms.css";
import { Link } from "react-router-dom";
import useGoogleMaps from "../../hooks/useGoogleMaps";

function FormEdit({ profile }) {
  const [formData, setFormData] = useState({
    email: profile?.email || "",
    old_password: "",
    password: "",
    password_confirmation: "",
    profile_picture: null,
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    age: profile?.age || "",
    sex: profile?.sex?.[0] ?? "",
    budget_min: profile?.budget_min ?? "",
    budget_max: profile?.budget_max ?? "",
    yearly_income: profile?.yearly_income ?? "",
    city: profile?.city || "",
    preferred_location: profile?.preferred_location || "",
    phone_number: profile?.phone_number || "",
    instagram_link: profile?.instagram_link || "",
    facebook_link: profile?.facebook_link || "",
    receive_email_notifications: profile?.receive_email_notifications || false,
    receive_sms_notifications: profile?.receive_sms_notifications || false,
    terms_accepted: profile?.terms_accepted || false,
  });

  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [existingProfilePicture, setExistingProfilePicture] = useState(
    profile?.profile_picture || null
  );
  const [deleteProfilePicture, setDeleteProfilePicture] = useState(false);
  const navigate = useNavigate();

  // Load Google Maps via hook
  const { googleMaps } = useGoogleMaps();

  // --- GOOGLE PLACES AUTOCOMPLETE REFS ---
  const cityInputRef = useRef(null);
  const preferredLocationInputRef = useRef(null);
  const autocompleteCityRef = useRef(null);
  const autocompletePreferredRef = useRef(null);

  useEffect(() => {
    if (!googleMaps) return; // Wait until the Maps API is loaded

    const options = { types: ["(cities)"] };

    // Clear previous listeners
    if (autocompleteCityRef.current) {
      googleMaps.maps.event.clearInstanceListeners(autocompleteCityRef.current);
      autocompleteCityRef.current = null;
    }
    if (autocompletePreferredRef.current) {
      googleMaps.maps.event.clearInstanceListeners(
        autocompletePreferredRef.current
      );
      autocompletePreferredRef.current = null;
    }

    if (cityInputRef.current) {
      autocompleteCityRef.current = new googleMaps.maps.places.Autocomplete(
        cityInputRef.current,
        options
      );
      autocompleteCityRef.current.addListener("place_changed", () => {
        const place = autocompleteCityRef.current.getPlace();
        const cityName =
          place.address_components?.find((c) => c.types.includes("locality"))
            ?.long_name ||
          place.address_components?.find((c) =>
            c.types.includes("administrative_area_level_1")
          )?.long_name ||
          place.name ||
          "";
        setFormData((prev) => ({ ...prev, city: cityName }));
      });
    }

    if (preferredLocationInputRef.current) {
      autocompletePreferredRef.current =
        new googleMaps.maps.places.Autocomplete(
          preferredLocationInputRef.current,
          options
        );
      autocompletePreferredRef.current.addListener("place_changed", () => {
        const place = autocompletePreferredRef.current.getPlace();
        const cityName =
          place.address_components?.find((c) => c.types.includes("locality"))
            ?.long_name ||
          place.address_components?.find((c) =>
            c.types.includes("administrative_area_level_1")
          )?.long_name ||
          place.name ||
          "";
        setFormData((prev) => ({ ...prev, preferred_location: cityName }));
      });
    }

    return () => {
      if (autocompleteCityRef.current) {
        googleMaps.maps.event.clearInstanceListeners(
          autocompleteCityRef.current
        );
        autocompleteCityRef.current = null;
      }
      if (autocompletePreferredRef.current) {
        googleMaps.maps.event.clearInstanceListeners(
          autocompletePreferredRef.current
        );
        autocompletePreferredRef.current = null;
      }
    };
  }, [googleMaps]);

  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        ...profile,
        password: "",
        password_confirmation: "",
        profile_picture: null,
        budget_min: profile.budget_min ?? "",
        budget_max: profile.budget_max ?? "",
        yearly_income: profile.yearly_income ?? "",
        sex: profile.sex[0] ?? "",
      }));
      setExistingProfilePicture(profile.profile_picture || null);
      setDeleteProfilePicture(false);
    }
  }, [profile]);

  // --- VALIDATION LOGIC ---
  function validateFields(data) {
    const errors = {};
    if (!data.email) errors.email = "Email is required.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email))
      errors.email = "Invalid email format.";

    if (showPasswordFields) {
      if (!data.old_password) errors.old_password = "Old password is required.";
      if (data.password || data.password_confirmation) {
        if (!data.password) errors.password = "Password is required.";
        else if (data.password.length < 8)
          errors.password = "Password must be at least 8 characters.";
        if (data.password !== data.password_confirmation)
          errors.password_confirmation = "Passwords do not match.";
      }
    }

    if (!data.first_name || data.first_name.length < 2)
      errors.first_name = "First name must be at least 2 characters.";
    if (!/^[a-zA-ZÀ-ÿ'. -]+$/.test(data.first_name))
      errors.first_name = "First name contains invalid characters.";
    if (!data.last_name || data.last_name.length < 2)
      errors.last_name = "Last name must be at least 2 characters.";
    if (!/^[a-zA-ZÀ-ÿ'. -]+$/.test(data.last_name))
      errors.last_name = "Last name contains invalid characters.";

    if (!data.age) errors.age = "Age is required.";
    else if (Number(data.age) < 16 || Number(data.age) > 120)
      errors.age = "Age must be between 16 and 120.";

    if (!["M", "F", "O"].includes(data.sex))
      errors.sex = "Select a valid gender.";

    if (data.budget_min !== "" && Number(data.budget_min) < 0)
      errors.budget_min = "Budget min cannot be negative.";
    if (!data.budget_max && data.budget_max !== 0)
      errors.budget_max = "Budget max is required.";
    else if (Number(data.budget_max) < 0)
      errors.budget_max = "Budget max cannot be negative.";
    if (
      data.budget_min !== "" &&
      data.budget_max !== "" &&
      Number(data.budget_min) > Number(data.budget_max)
    )
      errors.budget_min = "Min budget cannot be greater than max budget.";

    if (
      data.yearly_income !== "" &&
      (isNaN(Number(data.yearly_income)) || Number(data.yearly_income) < 0)
    )
      errors.yearly_income = "Income must be a positive number.";

    if (!data.city || data.city.length < 2) errors.city = "City is required.";

    if (!data.preferred_location || data.preferred_location.length < 2)
      errors.preferred_location = "Preferred location is required.";

    if (!data.phone_number) errors.phone_number = "Phone number required.";
    else if (!/^\+?[0-9\-()\s]{7,20}$/.test(data.phone_number))
      errors.phone_number = "Invalid phone number.";

    if (
      data.instagram_link &&
      !/^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._%-]+\/?$/.test(
        data.instagram_link
      )
    )
      errors.instagram_link = "Enter a valid Instagram URL.";
    if (
      data.facebook_link &&
      !/^https?:\/\/(www\.)?facebook\.com\/[A-Za-z0-9.\-_%/]+$/.test(
        data.facebook_link
      )
    )
      errors.facebook_link = "Enter a valid Facebook URL.";

    return errors;
  }

  // --- HANDLE CHANGE (NO VALIDATION ON EVERY KEYSTROKE) ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    console.log(formData);
  };

  // --- HANDLE BLUR (VALIDATE WHEN FIELD LOSES FOCUS) ---
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const validationErrors = validateFields(formData);
    setFieldErrors(validationErrors);
  };

  const handleFileInputChange = (e) => {
    const { files } = e.target;
    if (files && files[0]) {
      setFormData((prev) => ({
        ...prev,
        profile_picture: files[0],
      }));
      setExistingProfilePicture(null);
      setDeleteProfilePicture(false);
    }
  };

  const handleDeleteProfilePicture = () => {
    setExistingProfilePicture(null);
    setDeleteProfilePicture(true);
    setFormData((prev) => ({
      ...prev,
      profile_picture: null,
    }));
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (
      window.confirm(
        "Are you sure you want to delete your profile? This action cannot be undone."
      )
    ) {
      try {
        await api.delete("/delete-profile");
        navigate("/login");
      } catch (err) {
        console.error("Failed to delete profile.", err);
        setError("Failed to delete profile");
      }
    }
  };

  // --- HANDLE SUBMIT (VALIDATE FULL FORM) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const validationErrors = validateFields(formData);
    setFieldErrors(validationErrors);
    setTouched(
      Object.keys(formData).reduce((obj, key) => ({ ...obj, [key]: true }), {})
    );
    if (Object.keys(validationErrors).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const cleanFormData = {
      ...formData,
      budget_min:
        formData.budget_min === "" ? null : parseFloat(formData.budget_min),
      budget_max:
        formData.budget_max === "" ? null : parseFloat(formData.budget_max),
      yearly_income:
        formData.yearly_income === ""
          ? null
          : parseFloat(formData.yearly_income),
    };
    try {
      const data = new FormData();
      Object.entries(cleanFormData).forEach(([key, value]) => {
        if (key === "profile_picture") {
          if (value instanceof File) data.append(key, value);
        } else if (
          ["instagram_link", "facebook_link"].includes(key) &&
          typeof value === "string" &&
          value.trim() === ""
        ) {
          return;
        } else {
          data.append(key, value === null ? "" : value);
        }
      });
      if (deleteProfilePicture) {
        data.append("delete_profile_picture", "true");
      }
      const endpoint = "/edit-profile/";
      const response = await api.patch(endpoint, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.status === 200 || response.status === 201) {
        navigate(`/profile/${response.data.id}`);
      }
    } catch (err) {
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

  // --- ERROR MESSAGE HELPER ---
  const errMsg = (name) =>
    touched[name] && fieldErrors[name] ? (
      <div className="field-error">{fieldErrors[name]}</div>
    ) : null;

  const renderAvatarPreview = () => {
    if (formData.profile_picture instanceof File) {
      const src = URL.createObjectURL(formData.profile_picture);
      return (
        <div className="image-preview-grid">
          <div className="image-tile">
            <img src={src} alt="Profile preview" />
            <button
              type="button"
              aria-label="Remove profile picture"
              className="image-remove"
              onClick={() =>
                setFormData((prev) => ({ ...prev, profile_picture: null }))
              }
              title="Remove"
            >
              <span className="image-remove-x">&times;</span>
            </button>
          </div>
        </div>
      );
    }

    if (existingProfilePicture) {
      return (
        <div className="image-preview-grid">
          <div className="image-tile">
            <img src={existingProfilePicture} alt="Profile" />
            <button
              type="button"
              aria-label="Delete profile picture"
              className="image-remove"
              onClick={handleDeleteProfilePicture}
              title="Delete"
            >
              <span className="image-remove-x">&times;</span>
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="form-container" autoComplete="off">
      <h1> Edit Your Profile</h1>
      {error && (
        <ul className="error-list">
          {error.map((errMsg, index) => (
            <li key={index}>{errMsg}</li>
          ))}
        </ul>
      )}
      <h5 className="form-section-title">Basic Information</h5>
      <div>
        <label htmlFor="profile_picture">Profile Picture</label>
        <input
          type="file"
          id="profile_picture"
          name="profile_picture"
          accept="image/*"
          onChange={handleFileInputChange}
        />
      </div>
      {renderAvatarPreview()}
      <div className="mb-6">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          disabled={true}
          autoComplete="username"
        />
        {errMsg("email")}
      </div>
      <div className="form-grid">
        <div>
          <label htmlFor="first_name">First Name</label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            placeholder="First Name"
            value={formData.first_name}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            maxLength={50}
          />
          {errMsg("first_name")}
        </div>
        <div>
          <label htmlFor="last_name">Last Name</label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            placeholder="Last Name"
            value={formData.last_name}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            maxLength={50}
          />
          {errMsg("last_name")}
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <button
            type="button"
            className="btn btn-secondary py-1"
            style={{ margin: "10px 0" }}
            onClick={() => setShowPasswordFields((prev) => !prev)}
          >
            {showPasswordFields ? "Cancel" : "Change Password"}
          </button>
        </div>

        {showPasswordFields && (
          <>
            <input
              type="password"
              id="old_password"
              name="old_password"
              placeholder="Current Password"
              value={formData.old_password}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="current-password"
              required
            />
            {errMsg("old_password")}

            <input
              type="password"
              id="password"
              name="password"
              placeholder="New Password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="new-password"
              required
            />
            {errMsg("password")}
            <input
              type="password"
              id="password_confirmation"
              name="password_confirmation"
              placeholder="Confirm New Password"
              value={formData.password_confirmation}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="new-password"
              required
            />
            {errMsg("password_confirmation")}
          </>
        )}
      </div>

      <h5 className="form-section-title">Personal Information</h5>
      <div className="form-grid">
        <div>
          <label htmlFor="age">Age</label>
          <input
            type="number"
            id="age"
            name="age"
            placeholder="Age"
            value={formData.age}
            onChange={handleChange}
            onBlur={handleBlur}
            min="0"
            required
            step="1"
          />
          {errMsg("age")}
        </div>
        <div>
          <label htmlFor="sex">Gender</label>
          <select
            id="sex"
            name="sex"
            value={formData.sex[0]}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          >
            <option value="">Select your gender</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Other</option>
          </select>
          {errMsg("sex")}
        </div>
      </div>
      <div className="form-grid">
        <div>
          <label htmlFor="city">Current City</label>
          <input
            type="text"
            id="city"
            name="city"
            placeholder="City"
            value={formData.city}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            ref={cityInputRef}
          />
          {errMsg("city")}
        </div>
        <div>
          <label htmlFor="preferred_location">Preferred Location</label>
          <input
            type="text"
            id="preferred_location"
            name="preferred_location"
            placeholder="Preferred Location to live"
            value={formData.preferred_location}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            ref={preferredLocationInputRef}
          />
          {errMsg("preferred_location")}
        </div>
      </div>

      <h5 className="form-section-title">Financial Information</h5>
      <div className="form-grid">
        <div>
          <label htmlFor="budget_min">Budget Min</label>
          <input
            type="number"
            id="budget_min"
            name="budget_min"
            placeholder="Budget Min (Optional)"
            value={formData.budget_min}
            min="0"
            max={formData.budget_max || undefined}
            step="0.01"
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {errMsg("budget_min")}
        </div>
        <div>
          <label htmlFor="budget_max">Budget Max</label>
          <input
            type="number"
            id="budget_max"
            name="budget_max"
            placeholder="Budget Max"
            value={formData.budget_max}
            onChange={handleChange}
            onBlur={handleBlur}
            min="0"
            step="0.01"
            required
          />
          {errMsg("budget_max")}
        </div>
      </div>
      <div className="mb-6">
        <label htmlFor="yearly_income">Yearly Income</label>
        <input
          type="number"
          id="yearly_income"
          name="yearly_income"
          placeholder="Yearly Income (Optional)"
          value={formData.yearly_income}
          onChange={handleChange}
          onBlur={handleBlur}
          step="0.01"
          min="0"
        />
        {errMsg("yearly_income")}
      </div>

      <h5 className="form-section-title">Contact Information</h5>
      <div className="form-grid">
        <div>
          <label htmlFor="phone_number">Phone Number</label>
          <input
            type="text"
            id="phone_number"
            name="phone_number"
            placeholder="Phone Number (e.g., +1-123-456-7890)"
            value={formData.phone_number}
            onChange={handleChange}
            onBlur={handleBlur}
            pattern="^\+?[0-9\-()\s]{7,20}$"
            required
          />
          {errMsg("phone_number")}
        </div>
        <div>
          <label htmlFor="instagram_link">Instagram</label>
          <input
            type="url"
            id="instagram_link"
            name="instagram_link"
            placeholder="Instagram Link"
            value={formData.instagram_link}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {errMsg("instagram_link")}
        </div>
        <div>
          <label htmlFor="facebook_link">Facebook</label>
          <input
            type="url"
            id="facebook_link"
            name="facebook_link"
            placeholder="Facebook Link"
            value={formData.facebook_link}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {errMsg("facebook_link")}
        </div>
      </div>

      <label htmlFor="receive_email_notifications">
        <input
          type="checkbox"
          id="receive_email_notifications"
          name="receive_email_notifications"
          checked={formData.receive_email_notifications}
          onChange={handleChange}
        />
        I would like to receive email notifications
      </label>
      <label htmlFor="receive_sms_notifications">
        <input
          type="checkbox"
          id="receive_sms_notifications"
          name="receive_sms_notifications"
          checked={formData.receive_sms_notifications}
          onChange={handleChange}
        />
        I would like to receive text messages.
      </label>
      <label htmlFor="terms_accepted">
        <input
          type="checkbox"
          id="terms_accepted"
          name="terms_accepted"
          checked={formData.terms_accepted}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          disabled={true}
        />
        I accept the terms and conditions
      </label>
      {errMsg("terms_accepted")}

      <button type="submit" className="btn btn-primary">
        Save Changes
      </button>
      <button type="delete" className="btn btn-danger" onClick={handleDelete}>
        Delete Profile
      </button>
    </form>
  );
}

export default FormEdit;
