import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants.js";
import "../styles/forms.css";
import { Link } from "react-router-dom";

function FormLogIn({ method }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (localStorage.getItem(ACCESS_TOKEN)) {
        console.log(
          "User already logged in, logging out to avoid conflicts..."
        );
        localStorage.clear();
      }

      const response = await api.post("/login/", { email, password });

      localStorage.setItem(ACCESS_TOKEN, response.data.access);
      localStorage.setItem(REFRESH_TOKEN, response.data.refresh);
      navigate("/");
    } catch (err) {
      console.error("Error during login:", err);
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
          onChange={(e) => setEmail(e.target.value)}
          required
        />
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
          onChange={(e) => setPassword(e.target.value)}
          required
        />
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
