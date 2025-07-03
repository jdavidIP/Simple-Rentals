import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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

  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [existingProfilePicture, setExistingProfilePicture] = useState(profile?.profile_picture || null);
  const [deleteProfilePicture, setDeleteProfilePicture] = useState(false);
  const navigate = useNavigate();

  // --- GOOGLE PLACES AUTOCOMPLETE REFS ---
  const cityInputRef = useRef(null);
  const preferredLocationInputRef = useRef(null);
  const autocompleteCityRef = useRef(null);
  const autocompletePreferredRef = useRef(null);

  // --- GOOGLE PLACES AUTOCOMPLETE EFFECT ---
  useEffect(() => {
    // Remove any existing listeners
    if (autocompleteCityRef.current) {
      window.google?.maps?.event?.clearInstanceListeners(autocompleteCityRef.current);
      autocompleteCityRef.current = null;
    }
    if (autocompletePreferredRef.current) {
      window.google?.maps?.event?.clearInstanceListeners(autocompletePreferredRef.current);
      autocompletePreferredRef.current = null;
    }

    // Attach autocomplete if Google and input refs are ready
    if (window.google && window.google.maps && window.google.maps.places) {
      const options = { types: ["(cities)"] };

      if (cityInputRef.current) {
        autocompleteCityRef.current = new window.google.maps.places.Autocomplete(
          cityInputRef.current,
          options
        );
        autocompleteCityRef.current.addListener("place_changed", () => {
          const place = autocompleteCityRef.current.getPlace();
          const cityName =
            place.address_components?.find((c) =>
              c.types.includes("locality")
            )?.long_name ||
            place.address_components?.find((c) =>
              c.types.includes("administrative_area_level_1")
            )?.long_name ||
            place.name ||
            "";
          setFormData((prev) => ({ ...prev, city: cityName }));
        });
      }

      if (preferredLocationInputRef.current) {
        autocompletePreferredRef.current = new window.google.maps.places.Autocomplete(
          preferredLocationInputRef.current,
          options
        );
        autocompletePreferredRef.current.addListener("place_changed", () => {
          const place = autocompletePreferredRef.current.getPlace();
          const cityName =
            place.address_components?.find((c) =>
              c.types.includes("locality")
            )?.long_name ||
            place.address_components?.find((c) =>
              c.types.includes("administrative_area_level_1")
            )?.long_name ||
            place.name ||
            "";
          setFormData((prev) => ({ ...prev, preferred_location: cityName }));
        });
      }
    }

    // Cleanup function
    return () => {
      if (autocompleteCityRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteCityRef.current);
        autocompleteCityRef.current = null;
      }
      if (autocompletePreferredRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompletePreferredRef.current);
        autocompletePreferredRef.current = null;
      }
    };
  }, []);

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
      }));
      setExistingProfilePicture(profile.profile_picture || null);
      setDeleteProfilePicture(false);
    }
  }, [profile]);

  // --- VALIDATION LOGIC ---
  function validateFields(data) {
    const errors = {};
    // Email
    if (!data.email) errors.email = "Email is required.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email))
      errors.email = "Invalid email format.";

    // Password
    if (method !== "edit" || data.password || data.password_confirmation) {
      if (!data.password) errors.password = "Password is required.";
      else if (data.password.length < 8)
        errors.password = "Password must be at least 8 characters.";
      if (data.password !== data.password_confirmation)
        errors.password_confirmation = "Passwords do not match.";
    }

    // Names
    if (!data.first_name || data.first_name.length < 2)
      errors.first_name = "First name must be at least 2 characters.";
    if (!/^[a-zA-ZÀ-ÿ'. -]+$/.test(data.first_name))
      errors.first_name = "First name contains invalid characters.";
    if (!data.last_name || data.last_name.length < 2)
      errors.last_name = "Last name must be at least 2 characters.";
    if (!/^[a-zA-ZÀ-ÿ'. -]+$/.test(data.last_name))
      errors.last_name = "Last name contains invalid characters.";

    // Age
    if (!data.age) errors.age = "Age is required.";
    else if (Number(data.age) < 16 || Number(data.age) > 120)
      errors.age = "Age must be between 16 and 120.";

    // Sex
    if (!["M", "F", "O"].includes(data.sex))
      errors.sex = "Select a valid gender.";

    // Budget min/max
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

    // Yearly income
    if (
      data.yearly_income !== "" &&
      (isNaN(Number(data.yearly_income)) || Number(data.yearly_income) < 0)
    )
      errors.yearly_income = "Income must be a positive number.";

    // City
    if (!data.city || data.city.length < 2)
      errors.city = "City is required.";

    // Preferred location
    if (!data.preferred_location || data.preferred_location.length < 2)
      errors.preferred_location = "Preferred location is required.";

    // Phone
    if (!data.phone_number) errors.phone_number = "Phone number required.";
    else if (!/^\+?[0-9\-()\s]{7,20}$/.test(data.phone_number))
      errors.phone_number = "Invalid phone number.";

    // Instagram/Facebook
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

    // Terms
    if (!data.terms_accepted && method !== "edit")
      errors.terms_accepted = "You must accept the terms and conditions.";

    return errors;
  }

  // --- HANDLE CHANGE with LIVE VALIDATION ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: newValue };

      // Live validate ALL fields as you type
      const validationErrors = validateFields(updated);
      setFieldErrors(validationErrors);

      return updated;
    });
  };

  // --- HANDLE BLUR for TOUCHED TRACKING ---
  const handleBlur = (e) => {
    setTouched((prev) => ({
      ...prev,
      [e.target.name]: true,
    }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate one more time before submit
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
      budget_min: formData.budget_min === "" ? null : parseFloat(formData.budget_min),
      budget_max: formData.budget_max === "" ? null : parseFloat(formData.budget_max),
      yearly_income: formData.yearly_income === "" ? null : parseFloat(formData.yearly_income),
    };
    try {
      const data = new FormData();
      Object.entries(cleanFormData).forEach(([key, value]) => {
        if (
          method === "edit" &&
          (key === "password" || key === "password_confirmation") &&
          !value
        ) return;
        if (key === "profile_picture") {
          if (value instanceof File) data.append(key, value);
        } else if (["instagram_link", "facebook_link"].includes(key) && typeof value === "string" && value.trim() === "") {
          // Don't send empty social links
          return;
        } else {
          data.append(key, value === null ? "" : value);
        }
      });
      if (method === "edit" && deleteProfilePicture) {
        data.append("delete_profile_picture", "true");
      }
      const endpoint = method === "edit" ? "/edit-profile/" : "/register/";
      const response = await api[method === "edit" ? "patch" : "post"](endpoint, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.status === 200 || response.status === 201) {
        navigate(method === "edit" ? `/profile/${response.data.id}` : "/login");
      }
    } catch (err) {
      if (err.response && err.response.data) {
        const errorMessages = Object.entries(err.response.data).map(
          ([field, messages]) =>
            `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`
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

  // --- IMAGE PREVIEW ---
  const renderNewImagePreview = () =>
    formData.profile_picture instanceof File && (
      <div className="image-container">
        <img src={URL.createObjectURL(formData.profile_picture)} alt="Preview" style={{ maxWidth: "150px" }} />
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => setFormData((prev) => ({ ...prev, profile_picture: null }))}
        >
          Remove
        </button>
      </div>
    );

  return (
    <form onSubmit={handleSubmit} className="form-container" autoComplete="off">
      <h1>{method === "edit" ? "Edit Profile" : "Register"}</h1>
      {error && (
        <ul className="error-list">
          {error.map((errMsg, index) => (
            <li key={index}>{errMsg}</li>
          ))}
        </ul>
      )}

      <input
        type="email"
        id="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        onBlur={handleBlur}
        required
        disabled={method === "edit"}
        autoComplete="username"
      />
      {errMsg("email")}

      <input
        type="password"
        id="password"
        name="password"
        placeholder={
          method === "edit" ? "New Password (leave blank to keep current)" : "Password"
        }
        value={formData.password}
        onChange={handleChange}
        onBlur={handleBlur}
        required={method !== "edit"}
        autoComplete="new-password"
      />
      {errMsg("password")}

      <input
        type="password"
        id="password_confirmation"
        name="password_confirmation"
        placeholder={method === "edit" ? "Confirm New Password" : "Confirm Password"}
        value={formData.password_confirmation}
        onChange={handleChange}
        onBlur={handleBlur}
        required={method !== "edit"}
        autoComplete="new-password"
      />
      {errMsg("password_confirmation")}

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

      <select
        id="sex"
        name="sex"
        value={formData.sex}
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

      <input
        type="file"
        id="profile_picture"
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
          disabled={method === "edit"}
        />
        I accept the terms and conditions
      </label>
      {errMsg("terms_accepted")}

      <button type="submit">
        {method === "edit" ? "Save Changes" : "Register"}
      </button>
      {method !== "edit" && (
        <div>
          <Link to="/login" className="link">
            Already have an account? Log In here!
          </Link>
        </div>
      )}
    </form>
  );
}

export default FormRegister;
