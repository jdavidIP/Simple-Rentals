import React, { useEffect, useState } from "react";
import api from "../api";
import { useProfileContext } from "../contexts/ProfileContext";

function Header() {
  const { profile } = useProfileContext();

  return (
    <nav className="navbar fixed-top navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <a className="navbar-brand" href="/">
          Simple Rentals
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <a className="nav-link active" aria-current="page" href="/">
                Home
              </a>
            </li>
            <li className="nav-item">
              <a
                className="nav-link"
                href={profile ? `/profile/${profile.id}` : "/login"}
              >
                Account
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/listings">
                Listings
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/roommates">
                Roommates
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Header;
