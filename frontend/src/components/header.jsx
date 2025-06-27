import React, { useEffect, useRef, useState } from "react";
import api from "../api";
import { useProfileContext } from "../contexts/ProfileContext";

function Header() {
  const { profile, messages = [], applications = [] } = useProfileContext();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showDropdown) return;
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  // Count unread messages and unchecked applications
  const unreadMessages = messages.length;
  const uncheckedApplications = applications.filter(
    (app) => !app.checked
  ).length;
  const totalNotifications = unreadMessages + uncheckedApplications;

  // Show a preview (up to 3) for each
  const messagePreviews = messages.slice(0, 3);
  const applicationPreviews = applications
    .filter((app) => !app.checked)
    .slice(0, 3);

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
            <li className="nav-item dropdown" style={{ position: "relative" }}>
              <button
                className="btn btn-link nav-link"
                style={{ color: "white", position: "relative" }}
                onClick={() => setShowDropdown((v) => !v)}
                aria-label="Notifications"
              >
                <i className="bi bi-bell" style={{ fontSize: "1.5rem" }}></i>
                {totalNotifications > 0 && (
                  <span
                    className="badge bg-danger"
                    style={{
                      position: "absolute",
                      top: "0px",
                      right: "0px",
                      fontSize: "0.8rem",
                    }}
                  >
                    {totalNotifications}
                  </span>
                )}
              </button>
              {showDropdown && (
                <div
                  ref={dropdownRef}
                  className="dropdown-menu dropdown-menu-end show"
                  style={{
                    minWidth: "300px",
                    maxHeight: "400px",
                    overflowY: "auto",
                    right: 0,
                  }}
                >
                  <h6 className="dropdown-header">Notifications</h6>
                  <div className="dropdown-divider"></div>
                  <div>
                    <strong>Unread Messages</strong>
                    {unreadMessages === 0 && (
                      <div className="text-muted small px-3">
                        No unread messages
                      </div>
                    )}
                    {messagePreviews.map((msg) => (
                      <a
                        key={msg.id}
                        href={`/conversations/${msg.conversation}`}
                        className="dropdown-item"
                        style={{ whiteSpace: "normal" }}
                      >
                        <div>
                          <strong>{msg.sender?.first_name}:</strong>{" "}
                          {msg.content.length > 40
                            ? msg.content.slice(0, 40) + "..."
                            : msg.content}
                        </div>
                        <div className="text-muted small">
                          {new Date(msg.timestamp).toLocaleString()}
                        </div>
                      </a>
                    ))}
                  </div>
                  <div className="dropdown-divider"></div>
                  <div>
                    <strong>Applications to Check</strong>
                    {uncheckedApplications === 0 && (
                      <div className="text-muted small px-3">
                        No new applications
                      </div>
                    )}
                    {applicationPreviews.map((app) => (
                      <a
                        key={app.id}
                        href={`/applications/${app.id}`}
                        className="dropdown-item"
                        style={{ whiteSpace: "normal" }}
                      >
                        <div>
                          <strong>Group:</strong> {app.group?.name || "N/A"}
                        </div>
                        <div className="text-muted small">
                          {app.description
                            ? app.description.slice(0, 40) + "..."
                            : "No description"}
                        </div>
                      </a>
                    ))}
                  </div>
                  <div className="dropdown-divider"></div>
                  <a
                    href="/conversations"
                    className="dropdown-item text-primary"
                  >
                    View all messages
                  </a>
                  <a href="/" className="dropdown-item text-primary">
                    View all applications
                  </a>
                </div>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Header;
