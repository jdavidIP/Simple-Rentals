import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api.js";
import "../../styles/forms.css";
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

  // Google Places Autocomplete refs
  const cityInputRef = useRef(null);
  const preferredLocationInputRef = useRef(null);
  const autocompleteCityRef = useRef(null);
  const autocompletePreferredRef = useRef(null);
  const { googleMaps } = useGoogleMaps();

  // Initialize Google Places autocomplete
  useEffect(() => {
    if (!googleMaps) return;

    if (autocompleteCityRef.current)
      googleMaps.maps.event.clearInstanceListeners(autocompleteCityRef.current);
    if (autocompletePreferredRef.current)
      googleMaps.maps.event.clearInstanceListeners(
        autocompletePreferredRef.current
      );

    const options = { types: ["(cities)"] };

    // City autocomplete
    if (cityInputRef.current) {
      autocompleteCityRef.current = new googleMaps.maps.places.Autocomplete(
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

    // Preferred location autocomplete
    if (preferredLocationInputRef.current) {
      autocompletePreferredRef.current =
        new googleMaps.maps.places.Autocomplete(
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
        setFormData((prev) => ({
          ...prev,
          preferred_location: cityName,
        }));
      });
    }
  }, [googleMaps]);

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

  const renderImagePreview = () =>
    (formData.profile_picture instanceof File || existingProfilePicture) && (
      <div className="mb-3">
        <img
          src={
            formData.profile_picture
              ? URL.createObjectURL(formData.profile_picture)
              : existingProfilePicture
          }
          alt="Preview"
          className="img-thumbnail"
          style={{ maxWidth: "150px" }}
        />
        <button
          type="button"
          className="btn btn-sm btn-danger ms-2"
          onClick={handleDeletePicture}
        >
          Delete
        </button>
      </div>
    );

  const errMsg = (field) =>
    touched[field] && fieldErrors[field] ? (
      <div className="invalid-feedback d-block">{fieldErrors[field]}</div>
    ) : null;

  return (
    <div className="container py-5">
      <div className="card mx-auto shadow" style={{ maxWidth: "600px" }}>
        <div className="card-body">
          <h2 className="card-title text-center mb-4">
            {method === "edit" ? "Edit Profile" : "Register"} (Step {step}/3)
          </h2>

          <ul className="nav nav-pills nav-fill mb-4">
            {[1, 2, 3].map((i) => (
              <li className="nav-item" key={i}>
                <button
                  type="button"
                  className={`nav-link${
                    step === i ? " active" : step > i ? "" : " disabled"
                  }`}
                >
                  {["Credentials", "Info", "Extras"][i - 1]}
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
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
                  />
                  {errMsg("password_confirmation")}
                </div>
              </>
            )}

            {step === 2 && (
              <>
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
                    />
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
                <div className="mb-3">
                  <label className="form-label">Profile Picture</label>
                  <input
                    type="file"
                    name="profile_picture"
                    accept="image/*"
                    className="form-control"
                    onChange={handleChange}
                  />
                  {renderImagePreview()}
                </div>
                <div className="mb-3">
                  <label className="form-label">Instagram Link</label>
                  <input
                    type="url"
                    name="instagram_link"
                    className="form-control"
                    value={formData.instagram_link}
                    onChange={handleChange}
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
                  />
                </div>
                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    name="receive_email_notifications"
                    className="form-check-input"
                    checked={formData.receive_email_notifications}
                    onChange={handleChange}
                  />
                  <label className="form-check-label">
                    Receive Email Notifications
                  </label>
                </div>
                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    name="receive_sms_notifications"
                    className="form-check-input"
                    checked={formData.receive_sms_notifications}
                    onChange={handleChange}
                  />
                  <label className="form-check-label">
                    Receive SMS Notifications
                  </label>
                </div>
                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    name="terms_accepted"
                    className="form-check-input"
                    checked={formData.terms_accepted}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <label className="form-check-label">
                    I accept the terms and conditions
                  </label>
                  {errMsg("terms_accepted")}
                </div>
              </>
            )}

            <div className="d-flex justify-content-between">
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
      </div>
    </div>
  );
}

export default FormRegister;
