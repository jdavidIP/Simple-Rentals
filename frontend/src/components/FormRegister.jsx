import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api.js";
import "../styles/forms.css";

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
  const [existingProfilePicture, setExistingProfilePicture] = useState(profile?.profile_picture || null);
  const [deleteProfilePicture, setDeleteProfilePicture] = useState(false);
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

  const validateStep = () => {
    const errors = {};
    if (step === 1) {
      if (!formData.email) errors.email = "Email is required.";
      if (!formData.password || formData.password.length < 8) errors.password = "Min 8 characters.";
      if (formData.password !== formData.password_confirmation) errors.password_confirmation = "Passwords must match.";
    }
    if (step === 2) {
      ["first_name", "last_name", "age", "sex", "city", "preferred_location", "phone_number", "budget_max"]
        .forEach(field => { if (!formData[field]) errors[field] = "Required."; });
    }
    if (step === 3 && !formData.terms_accepted) {
      errors.terms_accepted = "Please accept terms.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => validateStep() && setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleChange = (e) => {
    const { name, type, checked, value, files } = e.target;
    const newValue = type === "checkbox" ? checked : (type === "file" ? files[0] : value);
    setFormData(prev => ({ ...prev, [name]: newValue }));
    setTouched(prev => ({ ...prev, [name]: true }));
  };
  const handleDeletePicture = () => {
    setFormData(prev => ({ ...prev, profile_picture: null }));
    setDeleteProfilePicture(true);
    setExistingProfilePicture(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    const data = new FormData();
    Object.entries(formData).forEach(([k, v]) => {
      if (k === "profile_picture" && v instanceof File) data.append(k, v);
      else if (typeof v === "boolean" || v) data.append(k, v);
    });
    if (deleteProfilePicture) data.append("delete_profile_picture", "true");
    try {
      const resp = await api[method === "edit" ? "patch" : "post"](
        method === "edit" ? "/edit-profile/" : "/register/",
        data, { headers: { "Content-Type": "multipart/form-data" } }
      );
      navigate(method === "edit" ? `/profile/${resp.data.id}` : "/login");
    } catch {
      alert("Submission failed.");
    }
  };

  const renderImagePreview = () =>
    (formData.profile_picture instanceof File || existingProfilePicture) && (
      <div className="mb-3">
        <img
          src={formData.profile_picture ? URL.createObjectURL(formData.profile_picture) : existingProfilePicture}
          alt="Preview" className="img-thumbnail" style={{ maxWidth: "150px" }}
        />
        <button type="button" className="btn btn-sm btn-danger ms-2" onClick={handleDeletePicture}>Delete</button>
      </div>
    );

  return (
    <div className="container py-5">
      <div className="card mx-auto shadow" style={{ maxWidth: "600px" }}>
        <div className="card-body">
          <h2 className="card-title text-center mb-4">
            {method === "edit" ? "Edit Profile" : "Register"} (Step {step}/3)
          </h2>

          <ul className="nav nav-pills nav-fill mb-4">
            {[1,2,3].map(i => (
              <li className="nav-item" key={i}>
                <button className={`nav-link${step === i ? " active" : (step > i ? "" : " disabled")}`}>
                  {["Credentials","Info","Extras"][i-1]}
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={handleSubmit} noValidate>
            {step === 1 && (
              <>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" name="email" className={`form-control${fieldErrors.email ? " is-invalid" : ""}`} value={formData.email} onChange={handleChange} />
                  <div className="invalid-feedback">{fieldErrors.email}</div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input type="password" name="password" className={`form-control${fieldErrors.password ? " is-invalid" : ""}`} value={formData.password} onChange={handleChange} />
                  <div className="invalid-feedback">{fieldErrors.password}</div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirm Password</label>
                  <input type="password" name="password_confirmation" className={`form-control${fieldErrors.password_confirmation ? " is-invalid" : ""}`} value={formData.password_confirmation} onChange={handleChange} />
                  <div className="invalid-feedback">{fieldErrors.password_confirmation}</div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                {["first_name","last_name","age","city","preferred_location","phone_number","budget_max"].map(field => (
                  <div className="mb-3" key={field}>
                    <label className="form-label">{field.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</label>
                    <input
                      type={field==="age" || field.includes("budget") ? "number" : "text"}
                      name={field}
                      ref={field === "city" ? cityInputRef : field === "preferred_location" ? preferredLocationInputRef : null}
                      className={`form-control${fieldErrors[field] ? " is-invalid" : ""}`}
                      value={formData[field]} onChange={handleChange}
                    />
                    <div className="invalid-feedback">{fieldErrors[field]}</div>
                  </div>
                ))}
                <div className="mb-3">
                  <label className="form-label">Gender</label>
                  <select name="sex" className={`form-select${fieldErrors.sex ? " is-invalid" : ""}`} value={formData.sex} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                  <div className="invalid-feedback">{fieldErrors.sex}</div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="mb-3">
                  <label className="form-label">Profile Picture</label>
                  <input type="file" name="profile_picture" accept="image/*" className="form-control" onChange={handleChange} />
                  {renderImagePreview()}
                </div>
                <div className="mb-3">
                  <label className="form-label">Instagram Link</label>
                  <input type="url" name="instagram_link" className="form-control" value={formData.instagram_link} onChange={handleChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Facebook Link</label>
                  <input type="url" name="facebook_link" className="form-control" value={formData.facebook_link} onChange={handleChange} />
                </div>
                <div className="form-check mb-3">
                  <input type="checkbox" name="receive_email_notifications" className="form-check-input" checked={formData.receive_email_notifications} onChange={handleChange} id="emailNotify" />
                  <label className="form-check-label" htmlFor="emailNotify">Receive Email Notifications</label>
                </div>
                <div className="form-check mb-3">
                  <input type="checkbox" name="receive_sms_notifications" className="form-check-input" checked={formData.receive_sms_notifications} onChange={handleChange} id="smsNotify" />
                  <label className="form-check-label" htmlFor="smsNotify">Receive SMS Notifications</label>
                </div>
                <div className="form-check mb-3">
                  <input type="checkbox" name="terms_accepted" className={`form-check-input${fieldErrors.terms_accepted ? " is-invalid" : ""}`} checked={formData.terms_accepted} onChange={handleChange} id="terms" />
                  <label className="form-check-label" htmlFor="terms">I accept the terms and conditions</label>
                  <div className="invalid-feedback">{fieldErrors.terms_accepted}</div>
                </div>
              </>
            )}

            <div className="d-flex justify-content-between">
              {step > 1 ? (
                <button type="button" className="btn btn-outline-secondary" onClick={handleBack}>Back</button>
              ) : <div />}

              {step < 3 ? (
                <button type="button" className="btn btn-primary" onClick={handleNext}>Next</button>
              ) : (
                <button type="submit" className="btn btn-success">{method === "edit" ? "Save Changes" : "Register"}</button>
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
