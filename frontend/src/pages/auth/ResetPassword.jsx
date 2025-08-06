import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import api from "../../api.js"; 
import "../../styles/auth-pages.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState(""); 
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setError("");

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/password-reset/confirm/", { uid, token, new_password: password });
      setStatus("success");
      setTimeout(() => navigate("/login"), 2200);
    } catch (err) {
      setStatus("error");
      setError(
        err.response?.data?.detail || "Could not reset password. Try again."
      );
    }
    setSubmitting(false);
  };

  // Hide form if token/uid missing
  if (!uid || !token) {
    return (
      <div className="main-centered-content">
        <div className="auth-card">
          <h1>Reset Password</h1>
          <div className="verify-status error">
            Invalid or missing password reset link.
          </div>
          <Link to="/login" className="btn btn-primary">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="main-centered-content">
      <div className="auth-card">
        <h1>Reset Password</h1>
        <p>Enter your new password below.</p>

        {status === "success" ? (
          <div className="verify-status success">
            Password reset! Redirecting to login...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ width: "100%" }}>
              <label className="form-label" htmlFor="password">
                New Password
              </label>
              <input
                className="form-control"
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={submitting}
                required
                minLength={8}
                style={{ marginBottom: 8 }}
              />

              <label className="form-label" htmlFor="confirm">
                Confirm Password
              </label>
              <input
                className="form-control"
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                disabled={submitting}
                required
                minLength={8}
                style={{ marginBottom: 6 }}
              />

              {error && <div className="field-error">{error}</div>}

              <button
                className="btn btn-primary"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Resetting..." : "Set New Password"}
              </button>
            </div>
          </form>
        )}
        <Link to="/login" className="link">
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default ResetPassword;
