import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api.js";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants.js";
import "../../styles/forms.css";

function FormLogIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  function validateFields({ email, password }) {
    const errors = {};
    if (!email) errors.email = "Email is required.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      errors.email = "Invalid email format.";
    if (!password) errors.password = "Password is required.";
    else if (password.length < 8)
      errors.password = "Password must be at least 8 characters.";
    return errors;
  }

  // Handle field changes (no live validation)
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "email") setEmail(value);
    if (name === "password") setPassword(value);
  };

  // Validate on blur
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const validationErrors = validateFields({ email, password });
    setFieldErrors(validationErrors);
  };

  // Error message helper
  const errMsg = (name) =>
    touched[name] && fieldErrors[name] ? (
      <div className="field-error">{fieldErrors[name]}</div>
    ) : null;

  // Submit with full validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    const validationErrors = validateFields({ email, password });
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setError(null);
    setIsSubmitting(true);

    try {
      if (localStorage.getItem(ACCESS_TOKEN)) localStorage.clear();

      const response = await api.post("/login/", { email, password });

      localStorage.setItem(ACCESS_TOKEN, response.data.access);
      localStorage.setItem(REFRESH_TOKEN, response.data.refresh);
      window.dispatchEvent(new Event("user-logged-in"));
      navigate("/listings");
    } catch (err) {
      if (err.response?.data?.detail?.toLowerCase()?.includes("not verified")) {
        navigate(`/verify-pending?email=${encodeURIComponent(email)}`);
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h1>Welcome Back!</h1>
      <p className="form-subtitle text-center mb-4">
        Please log in to your account
      </p>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="email" className="form-label">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Enter your email"
          value={email}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        {errMsg("email")}

        <label htmlFor="password" className="form-label">
          Password
        </label>
        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            placeholder="Enter your password"
            value={password}
            onChange={handleChange}
            onBlur={handleBlur}
            style={{ paddingRight: 40 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            style={{
              position: "absolute",
              top: "50%",
              right: 12,
              transform: "translateY(-50%)",
              border: "none",
              background: "none",
              padding: 0,
              margin: 0,
              cursor: "pointer",
              outline: "none"
            }}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <i
              className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
              style={{ fontSize: 20 }}
            ></i>
          </button>
        </div>
        {errMsg("password")}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>

        <Link to="/register">Not registered yet? Create an account</Link>
      </form>
    </div>
  );
}

export default FormLogIn;
