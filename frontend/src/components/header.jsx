import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

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

  const unreadMessages = messages.length; // adjust if you track read/unread individually
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
      <nav className="navbar navbar-expand-lg custom-navbar navbar-blur sticky-top">
        <div className="container">
          {/* Brand */}
          <NavLink className="navbar-brand d-flex align-items-center" to="/">
            <img
              src="../../transp_full_icon.png"
              alt="Logo"
              className="brand-logo"
            />
          </NavLink>

          {/* Toggler */}
          <button
            className="navbar-toggler shadow-none border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>

          {/* Nav Content */}
          <div className="collapse navbar-collapse" id="navbarNav">
            {/* Center nav (primary) */}
            <ul className="navbar-nav primary-nav mx-auto">
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
            </ul>

            {/* Right actions */}
            <ul className="navbar-nav align-items-center right-actions">
              {profile ? (
                <>
                  <li className="nav-item">
                    <button
                      className="icon-btn"
                      onClick={() => navigate("listings/favourites")}
                      aria-label="See Favourites"
                    >
                      <i
                        className="bi bi-heart"
                        style={{ transform: "translateY(0.1rem)" }}
                      ></i>
                    </button>
                  </li>
                  {/* Notifications */}
                  <li className="nav-item">
                    <button
                      className="icon-btn"
                      onClick={() => setSidebarOpen(true)}
                      aria-label="Open notifications"
                    >
                      <i className="bi bi-bell"></i>
                      {totalNotifications > 0 && (
                        <span className="badge notif-badge">
                          {totalNotifications}
                        </span>
                      )}
                    </button>
                  </li>

                  {/* Avatar dropdown */}
                  <li className="nav-item dropdown">
                    <button
                      className="avatar-btn dropdown-toggle"
                      id="profileMenu"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <img
                        src={profile.profile_picture || "/default_profile.png"}
                        alt="Profile"
                        className="avatar"
                      />
                    </button>
                    <ul
                      className="dropdown-menu dropdown-menu-end shadow"
                      aria-labelledby="profileMenu"
                    >
                      <li>
                        <Link
                          className="dropdown-item"
                          to={`/profile/${profile.id}`}
                        >
                          My Profile
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/conversations">
                          Conversations
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/applications">
                          Applications
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item"
                          to="/groups/invitations"
                        >
                          Invitations
                        </Link>
                      </li>
                      <li>
                        <hr className="dropdown-divider" />
                      </li>
                      <li>
                        <a className="dropdown-item text-danger" href="/logout">
                          Sign Out
                        </a>
                      </li>
                    </ul>
                  </li>
                </>
              ) : (
                <>
                  {/* When logged out */}
                  <li className="nav-item">
                    <NavLink to="/login" className="btn cta-post ms-2">
                      Sign In
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink to="/register" className="btn cta-post ms-2">
                      Sign Up
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* Notification Sidebar */}
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
