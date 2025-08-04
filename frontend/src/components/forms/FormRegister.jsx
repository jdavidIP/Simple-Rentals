import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api.js";
import "../../styles/register.css";
import useGoogleMaps from "../../hooks/useGoogleMaps";

function FormRegister({ method = "register", profile }) {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
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

  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [existingProfilePicture, setExistingProfilePicture] = useState(
    profile?.profile_picture || null
  );
  const [deleteProfilePicture, setDeleteProfilePicture] = useState(false);
  const [phoneInput, setPhoneInput] = useState(
    formatPhoneDisplay(profile?.phone_number) || ""
  );

  const { googleMaps } = useGoogleMaps();

  // Google Places Autocomplete refs
  const cityInputRef = useRef(null);
  const preferredLocationInputRef = useRef(null);
  const autocompleteCityRef = useRef(null);
  const autocompletePreferredRef = useRef(null);

  // Initialize Google Places autocomplete
  useEffect(() => {
    if (!googleMaps || !googleMaps.maps || !googleMaps.maps.places) return;

    const options = { types: ["(cities)"] };

    const setupAutocomplete = (inputRef, field) => {
      if (!inputRef.current) return null;
      const autocomplete = new googleMaps.maps.places.Autocomplete(
        inputRef.current,
        options
      );
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const cityName =
          place.address_components?.find((c) => c.types.includes("locality"))
            ?.long_name ||
          place.address_components?.find((c) =>
            c.types.includes("administrative_area_level_1")
          )?.long_name ||
          place.name ||
          "";
        setFormData((prev) => ({ ...prev, [field]: cityName }));
      });
      return autocomplete;
    };

    autocompleteCityRef.current = setupAutocomplete(cityInputRef, "city");
    autocompletePreferredRef.current = setupAutocomplete(
      preferredLocationInputRef,
      "preferred_location"
    );

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
  }, [googleMaps, step]);

  // Validation for each step
  const validateStep = (data = formData) => {
    const errors = {};
    if (step === 1) {
      if (!data.email) errors.email = "Email is required.";
      else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email))
        errors.email = "Invalid email format.";
      if (!data.password || data.password.length < 8)
        errors.password = "Min 8 characters.";
      if (data.password !== data.password_confirmation)
        errors.password_confirmation = "Passwords must match.";
    }
    if (step === 2) {
      [
        "first_name",
        "last_name",
        "age",
        "sex",
        "city",
        "preferred_location",
        "phone_number",
        "budget_max",
      ].forEach((field) => {
        if (!data[field]) errors[field] = "Required.";
      });
    }
    if (step === 3 && !data.terms_accepted) {
      errors.terms_accepted = "Please accept terms.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Calculate validity of the current step
  const isStepValid = useMemo(() => {
    if (step === 1) {
      return (
        formData.email &&
        /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email) &&
        formData.password &&
        formData.password.length >= 8 &&
        formData.password === formData.password_confirmation
      );
    }
    if (step === 2) {
      return [
        "first_name",
        "last_name",
        "age",
        "sex",
        "city",
        "preferred_location",
        "phone_number",
        "budget_max",
      ].every((field) => !!formData[field]);
    }
    if (step === 3) {
      return formData.terms_accepted;
    }
    return true;
  }, [step, formData]);

  const handleNext = () => {
    if (validateStep()) setStep(step + 1);
  };

  const handleBack = () => setStep(step - 1);

  const handleChange = (e) => {
    const { name, type, checked, value, files } = e.target;
    const newValue =
      type === "checkbox" ? checked : type === "file" ? files[0] : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
    validateStep(formData);
  };

  const handleDeletePicture = () => {
    setFormData((prev) => ({ ...prev, profile_picture: null }));
    setDeleteProfilePicture(true);
    setExistingProfilePicture(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allValid = validateStep(formData);
    setTouched(Object.fromEntries(Object.keys(formData).map((k) => [k, true])));
    if (!allValid) return;

    const data = new FormData();
    Object.entries(formData).forEach(([k, v]) => {
      if (k === "profile_picture" && v instanceof File) data.append(k, v);
      else if (typeof v === "boolean" || v) data.append(k, v);
    });
    if (deleteProfilePicture) data.append("delete_profile_picture", "true");

    try {
      const resp = await api[method === "edit" ? "patch" : "post"](
        method === "edit" ? "/edit-profile/" : "/register/",
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      navigate(method === "edit" ? `/profile/${resp.data.id}` : "/login");
    } catch (err) {
      console.error("Register error:", err.response?.data || err.message);
      alert("Submission failed. Please check your details.");
    }
  };

  const renderImagePreview = () => {
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
  };

  const errMsg = (field) =>
    touched[field] && fieldErrors[field] ? (
      <div className="invalid-feedback d-block">{fieldErrors[field]}</div>
    ) : null;

  function formatPhoneDisplay(input) {
    if (!input) return "";

    let digits = input.replace(/\D/g, "");

    if (digits.length === 11 && digits.startsWith("1")) {
      digits = digits.substring(1);
    }

    digits = digits.substring(0, 10);

    const area = digits.substring(0, 3);
    const prefix = digits.substring(3, 6);
    const line = digits.substring(6, 10);

    if (digits.length > 6) return `(${area}) ${prefix}-${line}`;
    if (digits.length > 3) return `(${area}) ${prefix}`;
    if (digits.length > 0) return `(${area}`;
    return "";
  }

  function formatPhoneBackend(digits) {
    if (digits.length !== 10) return "";
    return `+1-${digits.substring(0, 3)}-${digits.substring(
      3,
      6
    )}-${digits.substring(6, 10)}`;
  }

  return (
    <div className="form-container register-form">
      <h1>{method === "edit" ? "Edit Profile" : "Register"}</h1>

      {/* Step Progress Bar */}
      <ul className="register-progress">
        {[1, 2, 3].map((i) => (
          <li
            key={i}
            className={`progress-step ${
              step === i ? "active" : step > i ? "completed" : ""
            }`}
          >
            <span className="circle">{i}</span>
            <span className="label">
              {["Credentials", "Info", "Extras"][i - 1]}
            </span>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="fade-in-step">
        {step === 1 && (
          <>
            <h2 className="form-section-title">Account Credentials</h2>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="you@example.com"
              />
              {errMsg("email")}
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter a password (Min 8 characters)"
              />
              {errMsg("password")}
            </div>
            <div className="mb-3">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="password_confirmation"
                className="form-control"
                value={formData.password_confirmation}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Confirm Password"
              />
              {errMsg("password_confirmation")}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="form-section-title">Personal Information</h2>
            {[
              "first_name",
              "last_name",
              "age",
              "city",
              "preferred_location",
              "phone_number",
              "budget_max",
            ].map((field) => (
              <div className="mb-3" key={field}>
                <label className="form-label">
                  {field
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </label>

                {field === "phone_number" ? (
                  <input
                    type="text"
                    name="phone_number"
                    className="form-control"
                    placeholder="(123) 456-7890"
                    value={phoneInput}
                    onChange={(e) => {
                      const raw = e.target.value
                        .replace(/\D/g, "")
                        .substring(0, 10);
                      const display = formatPhoneDisplay(raw);
                      const backend = formatPhoneBackend(raw);

                      setPhoneInput(display); // keep UI responsive
                      setFormData((prev) => ({
                        ...prev,
                        phone_number: backend, // backend-friendly
                      }));
                    }}
                    onBlur={handleBlur}
                    maxLength="14"
                    required
                  />
                ) : (
                  <input
                    type={
                      field === "age" || field.includes("budget")
                        ? "number"
                        : "text"
                    }
                    name={field}
                    ref={
                      field === "city"
                        ? cityInputRef
                        : field === "preferred_location"
                        ? preferredLocationInputRef
                        : null
                    }
                    className="form-control"
                    value={formData[field]}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={`Enter ${field.replace(/_/g, " ")}`}
                  />
                )}

                {errMsg(field)}
              </div>
            ))}

            <div className="mb-3">
              <label className="form-label">Gender</label>
              <select
                name="sex"
                className="form-select"
                value={formData.sex}
                onChange={handleChange}
                onBlur={handleBlur}
              >
                <option value="">Select</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
              {errMsg("sex")}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="form-section-title">Profile Extras</h2>
            <div className="mb-3">
              <label className="form-label">Profile Picture</label>
              <div className="file-input-wrapper">
                <input
                  type="file"
                  name="profile_picture"
                  accept="image/*"
                  className="form-control file-input"
                  onChange={handleChange}
                />
                {renderImagePreview()}
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Instagram Link</label>
              <input
                type="url"
                name="instagram_link"
                className="form-control"
                value={formData.instagram_link}
                onChange={handleChange}
                placeholder="https://instagram.com/yourprofile"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Facebook Link</label>
              <input
                type="url"
                name="facebook_link"
                className="form-control"
                value={formData.facebook_link}
                onChange={handleChange}
                placeholder="https://facebook.com/yourprofile"
              />
            </div>
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="receive_email_notifications"
                  checked={formData.receive_email_notifications}
                  onChange={handleChange}
                />
                Receive Email Notifications
              </label>
              <label>
                <input
                  type="checkbox"
                  name="receive_sms_notifications"
                  checked={formData.receive_sms_notifications}
                  onChange={handleChange}
                />
                Receive SMS Notifications
              </label>
              <label>
                <input
                  type="checkbox"
                  name="terms_accepted"
                  checked={formData.terms_accepted}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                I accept the terms and conditions
              </label>
              {errMsg("terms_accepted")}
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="form-navigation">
          {step > 1 ? (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleBack}
            >
              Back
            </button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
              disabled={!isStepValid}
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-success"
              disabled={!isStepValid}
            >
              {method === "edit" ? "Save Changes" : "Register"}
            </button>
          )}
        </div>

        {method !== "edit" && step === 1 && (
          <div className="text-center mt-3">
            <Link to="/login">Already have an account? Log In</Link>
          </div>
        )}
      </form>
    </div>
  );
}

export default FormRegister;
