import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants.js";
import "../styles/forms.css";
import { Link } from "react-router-dom";

function FormLogIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "email") setEmail(value);
    if (name === "password") setPassword(value);

    const data = {
      email: name === "email" ? value : email,
      password: name === "password" ? value : password,
    };
    setFieldErrors(validateFields(data));
  };

  const handleBlur = (e) => {
    setTouched((prev) => ({
      ...prev,
      [e.target.name]: true,
    }));
  };

  const errMsg = (name) =>
    touched[name] && fieldErrors[name] ? (
      <div className="field-error">{fieldErrors[name]}</div>
    ) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({ email: true, password: true });
    const validationErrors = validateFields({ email, password });
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setError(null);
    try {
      if (localStorage.getItem(ACCESS_TOKEN)) {
        localStorage.clear();
      }
      const response = await api.post("/login/", { email, password });

      localStorage.setItem(ACCESS_TOKEN, response.data.access);
      localStorage.setItem(REFRESH_TOKEN, response.data.refresh);
      window.dispatchEvent(new Event("user-logged-in"));
      navigate("/listings");
    } catch (err) {
      setError("Login failed. Please check your credentials.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h1>Login</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div className="mb-3">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          className="form-control"
          placeholder="Enter your email"
          value={email}
          onChange={handleChange}
          onBlur={handleBlur}
          required
        />
        {errMsg("email")}
      </div>
      <div className="mb-3">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          className="form-control"
          placeholder="Enter your password"
          value={password}
          onChange={handleChange}
          onBlur={handleBlur}
          required
        />
        {errMsg("password")}
      </div>

      <div>
        <button type="submit" className="btn btn-primary">
          Login
        </button>
      </div>

      <div>
        <Link to="/register" className="link">
          {" "}
          Not registered yet? Create an account here!{" "}
        </Link>
      </div>
    </form>
  );
}

export default FormLogIn;
