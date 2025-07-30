import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import "../styles/verify.css";
import api from "../../api.js";

function VerifyPending() {
  const [searchParams] = useSearchParams();
  const emailFromParams = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailFromParams);

  const [resendStatus, setResendStatus] = useState("idle");
  const [resendError, setResendError] = useState(null);

  useEffect(() => {
    setEmail(emailFromParams);
  }, [emailFromParams]);

  const handleResend = async (e) => {
    e.preventDefault();
    setResendStatus("loading");
    setResendError(null);

    try {
      await api.post("/resend-verification/", { email });
      setResendStatus("sent");
      // Optionally clear after 3s:
      setTimeout(() => setResendStatus("idle"), 3000);
    } catch (err) {
      setResendStatus("error");
      setResendError(
        err.response?.data?.detail ||
          "Failed to resend verification email. Please try again later."
      );
    }
  };

  return (
    <div className="main-centered-content">
      <div className="verify-page-container">
        <h1>Verify your email</h1>
        <p>
          {email ? (
            <>
              To activate your account, check your inbox for a verification
              email sent to <b>{email}</b>.
            </>
          ) : (
            <>
              To activate your account, please check your email for a
              verification link.
            </>
          )}
        </p>
        <form
          onSubmit={handleResend}
          style={{ width: "100%", textAlign: "center" }}
        >
          <button
            type="submit"
            className="verify-btn-outline"
            disabled={resendStatus === "loading"}
          >
            {resendStatus === "loading"
              ? "Resending..."
              : "Resend verification email"}
          </button>
        </form>
        {resendStatus === "sent" && (
          <div className="verify-status success">
            A new verification email has been sent!
          </div>
        )}
        {resendStatus === "error" && (
          <div className="verify-status error">{resendError}</div>
        )}
        <Link to="/login" className="verify-link">
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default VerifyPending;
