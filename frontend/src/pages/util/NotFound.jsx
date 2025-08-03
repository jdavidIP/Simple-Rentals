import React from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api.js";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      className="d-flex flex-column justify-content-center align-items-center text-center vh-100 bg-light"
      style={{ padding: "2rem" }}
    >
      <div className="mb-4">
        <h1 className="display-1 fw-bold" style={{ fontSize: "6rem" }}>
          404
        </h1>
        <h2 className="mb-3">Oops! Page not found 😕</h2>
        <p className="text-muted" style={{ maxWidth: "500px" }}>
          The page you're looking for doesn't exist or has been moved. Let’s get
          you back on track!
        </p>
      </div>

      <div className="d-flex gap-3 flex-wrap justify-content-center">
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          Go Home
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate(-1)}
        >
          🔎 Try Previous Page
        </button>
      </div>

      <div className="mt-5 text-muted" style={{ fontSize: "0.9rem" }}>
        Or enjoy some silence while you're here 🧘‍♂️
      </div>
    </div>
  );
}

export default NotFound;
