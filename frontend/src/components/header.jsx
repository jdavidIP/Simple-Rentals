import React, { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useProfileContext } from "../contexts/ProfileContext";
import NotificationSidebar from "./NotificationSidebar";
import "../styles/navbar.css";

function Header() {
  const {
    profile,
    messages = [],
    applications = [],
    invitations = {},
  } = useProfileContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    if (!sidebarOpen) return;
    function handleClickOutside(event) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarOpen]);

  const receivedInvitations = Array.isArray(invitations.received)
    ? invitations.received
    : [];
  const sentInvitations = Array.isArray(invitations.sent)
    ? invitations.sent
    : [];

  const receivedUnresponded = receivedInvitations.filter(
    (inv) => inv.accepted === null
  );
  const sentResponded = sentInvitations.filter((inv) => inv.accepted !== null);

  const unreadMessages = messages.length;
  const uncheckedApplications = applications.filter(
    (app) => !app.checked
  ).length;

  const totalNotifications =
    unreadMessages +
    uncheckedApplications +
    receivedUnresponded.length +
    sentResponded.length;

  return (
    <>
      <nav className="navbar navbar-expand-lg custom-navbar">
        <div className="container">
          <NavLink className="navbar-brand" to="/">
            <img
              src="../transp_full_icon.png"
              alt="Logo"
              style={{ height: "60px" }}
            />
          </NavLink>
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
            <ul className="navbar-nav ms-auto nav-pills">
              <li className="nav-item">
                <NavLink end to="/" className="nav-link">
                  Home
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to={profile ? `/profile/${profile.id}` : "/login"}
                  className="nav-link"
                >
                  Account
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/listings" className="nav-link">
                  Listings
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/roommates" className="nav-link">
                  Roommates
                </NavLink>
              </li>
              <li className="nav-item">
                {profile ? (
                  <a href="/logout" className="nav-link">
                    Sign Out
                  </a>
                ) : (
                  <a href="/login" className="nav-link">
                    Sign In
                  </a>
                )}
              </li>
              <li className="nav-item">
                <button
                  className="btn btn-link nav-link notification-btn"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Notifications"
                >
                  <i className="bi bi-bell"></i>
                  {totalNotifications > 0 && (
                    <span className="badge bg-danger notification-badge">
                      {totalNotifications}
                    </span>
                  )}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <NotificationSidebar
        ref={sidebarRef}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        messages={messages}
        applications={applications}
        receivedUnresponded={receivedUnresponded}
        sentResponded={sentResponded}
      />
    </>
  );
}

export default Header;
