import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api.js";
import "../../styles/register.css";
import useGoogleMaps from "../../hooks/useGoogleMaps";

function passwordStrength(password) {
  if (!password) return "";
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return "Weak";
  if (score === 3 || score === 4) return "Medium";
  return "Strong";
}

function passwordStrengthColor(strength) {
  if (strength === "Weak") return "text-danger";
  if (strength === "Medium") return "text-warning";
  if (strength === "Strong") return "text-success";
  return "";
}

function passwordImprovementHints(password) {
  if (!password) return [];
  const hints = [];
  if (password.length < 8) hints.push("Use at least 8 characters");
  if (!/[A-Z]/.test(password)) hints.push("Add an uppercase letter");
  if (!/[a-z]/.test(password)) hints.push("Add a lowercase letter");
  if (!/[0-9]/.test(password)) hints.push("Add a number");
  if (!/[^A-Za-z0-9]/.test(password)) hints.push("Add a special symbol (e.g. !@#$%)");
  return hints;
}

function FormRegister({ method = "register", profile }) {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
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
  const [passwordFocused, setPasswordFocused] = useState(false);
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
      // Email
      if (!data.email) errors.email = "Email is required.";
      else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email))
        errors.email = "Invalid email format.";
      else if (data.email.length > 255)
        errors.email = "Email is too long.";

      // Password
      if (!data.password) errors.password = "Password is required.";
      else if (data.password.length < 8)
        errors.password = "Password must be at least 8 characters.";

      // Confirm password
      if (!data.password_confirmation)
        errors.password_confirmation = "Please confirm your password.";
      else if (data.password !== data.password_confirmation)
        errors.password_confirmation = "Passwords do not match.";
    }

    if (step === 2) {
      if (!data.first_name) errors.first_name = "First name is required.";
      else if (!/^[A-Za-z\s'-]{2,30}$/.test(data.first_name))
        errors.first_name = "Enter a valid first name (2-30 letters).";
      if (!data.last_name) errors.last_name = "Last name is required.";
      else if (!/^[A-Za-z\s'-]{2,30}$/.test(data.last_name))
        errors.last_name = "Enter a valid last name (2-30 letters).";
      if (!data.age && data.age !== 0) errors.age = "Age is required.";
      else if (Number(data.age) < 18)
        errors.age = "You must be at least 18 years old.";
      else if (Number(data.age) > 120)
        errors.age = "Enter a realistic age.";
      if (!["M", "F", "O"].includes(data.sex)) errors.sex = "Please select a gender.";
      if (!data.city) errors.city = "Current city is required.";
      else if (data.city.length < 2 || data.city.length > 80)
        errors.city = "Enter a valid city name.";
      if (!data.preferred_location) errors.preferred_location = "Preferred location is required.";
      else if (data.preferred_location.length < 2 || data.preferred_location.length > 80)
        errors.preferred_location = "Enter a valid location name.";
      if (!data.phone_number) errors.phone_number = "Phone number required.";
      else if (!/^\+1-\d{3}-\d{3}-\d{4}$/.test(data.phone_number))
        errors.phone_number = "Enter a valid US/Canada number: (123) 456-7890";
      if (!data.budget_max) errors.budget_max = "Maximum budget required.";
      else if (isNaN(data.budget_max) || Number(data.budget_max) < 100)
        errors.budget_max = "Enter a valid max budget (at least $100).";
      if (data.budget_min && (isNaN(data.budget_min) || Number(data.budget_min) < 0))
        errors.budget_min = "Enter a valid minimum budget.";
      if (
        data.budget_min &&
        data.budget_max &&
        Number(data.budget_min) > Number(data.budget_max)
      )
        errors.budget_min = "Minimum budget cannot exceed maximum.";
      if (
        data.yearly_income &&
        (isNaN(data.yearly_income) ||
          Number(data.yearly_income) < 0 ||
          Number(data.yearly_income) > 10000000)
      )
        errors.yearly_income = "Enter a valid yearly income.";
    }

    if (step === 3) {
      if (data.profile_picture && data.profile_picture instanceof File) {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(data.profile_picture.type))
          errors.profile_picture = "Allowed formats: JPG, PNG, WEBP, GIF.";
        else if (data.profile_picture.size > 3 * 1024 * 1024)
          errors.profile_picture = "File too large (max 3MB).";
      }
      if (data.instagram_link && !/^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9_.-]+\/?$/.test(data.instagram_link))
        errors.instagram_link = "Enter a valid Instagram URL.";
      if (data.facebook_link && !/^https:\/\/(www\.)?facebook\.com\/[A-Za-z0-9.]+\/?$/.test(data.facebook_link))
        errors.facebook_link = "Enter a valid Facebook URL.";
      if (!data.terms_accepted) errors.terms_accepted = "Please accept the terms.";
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
      const apiErrors = err.response?.data || {};
      if (typeof apiErrors === "object" && Object.keys(apiErrors).length) {
        const newFieldErrors = {};
        let allErrors = [];
        for (const [field, value] of Object.entries(apiErrors)) {
          let msgs = Array.isArray(value) ? value : [value];
          msgs = msgs.map(msg => {
            if (
              field === "email" &&
              msg.trim().toLowerCase().includes("already taken")
            ) {
              return (
                msg +
                " If you already have an account, you can sign in instead."
              );
            }
            return msg;
          });
          newFieldErrors[field] = msgs[0];
          allErrors.push(...msgs);
        }
        setFieldErrors(newFieldErrors);

        alert(allErrors.join('\n'));
      } else {
        setFieldErrors({ non_field_error: "Submission failed. Please try again." });
        alert("Submission failed. Please try again.");
      }
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
            <div className="mb-3" style={{ position: "relative" }}>
              <label className="form-label">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setPasswordFocused(true)}
                onBlur={e => {
                  setPasswordFocused(false);
                  handleBlur(e);
                }}
                placeholder="Enter a password (Min 8 characters)"
                autoComplete="new-password"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                style={{
                  position: "absolute",
                  top: "38px",
                  right: "12px",
                  border: "none",
                  background: "none",
                  padding: 0,
                  margin: 0,
                  cursor: "pointer",
                  outline: "none"
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} style={{ fontSize: 20 }}></i>
              </button>
              {formData.password && passwordFocused && (
                <div className={`small ${passwordStrengthColor(passwordStrength(formData.password))}`}>
                  Password strength: {passwordStrength(formData.password)}
                </div>
              )}
              {formData.password && passwordFocused && passwordStrength(formData.password) !== "Strong" && (
                <ul className="small text-muted mb-1" style={{ paddingLeft: 18 }}>
                  {passwordImprovementHints(formData.password).map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ul>
              )}
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
              className="btn btn-primary"
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
