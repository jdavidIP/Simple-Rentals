import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import "../styles/verify.css";
import api from "../../api.js";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      try {
        await api.post("/verify-email/", { uid, token });
        setStatus("success");
        setMessage("Your email has been verified! You can now log in.");
      } catch (err) {
        setStatus("error");
        setMessage(
          err.response?.data?.detail ||
            "Verification link is invalid or expired. Please request a new one."
        );
      }
    };

    if (uid && token) {
      verify();
    } else {
      setStatus("error");
      setMessage("Missing verification info in the link.");
    }
  }, [uid, token]);

  return (
    <div className="main-centered-content">
      <div className="verify-page-container">
        <h1>Email Verification</h1>
        {status === "verifying" && (
          <div className="verify-status info">Verifying your email...</div>
        )}
        {status === "success" && (
          <div className="verify-status success">{message}</div>
        )}
        {status === "error" && (
          <div className="verify-status error">{message}</div>
        )}
        <Link
          to="/login"
          className={status === "success" ? "verify-btn" : "verify-btn-outline"}
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default VerifyEmail;
