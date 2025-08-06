import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api.js";
import "../../styles/auth-pages.css";

function RequestPasswordReset() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(""); setError("");
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/password-reset/", { email });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(
        err.response?.data?.detail || "Could not send reset link. Try again."
      );
    }
    setSubmitting(false);
  };

  return (
    <div className="main-centered-content">
      <div className="auth-card">
        <h1>Forgot Password?</h1>
        <p>Enter your account email and we’ll send you a reset link.</p>
        {status === "success" ? (
          <div className="verify-status success">
            If that email exists, a reset link has been sent.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="form-label" htmlFor="email">Email</label>
            <input
              className="form-control"
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={submitting}
            />
            {error && <div className="field-error">{error}</div>}
            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}
        <Link to="/login" className="link">Back to Login</Link>
      </div>
    </div>
  );
}
export default RequestPasswordReset;
