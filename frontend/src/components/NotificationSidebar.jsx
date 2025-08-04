import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/navbar.css";
import "../styles/sidebar.css";

const NotificationSidebar = React.forwardRef(
  (
    {
      open,
      onClose,
      messages,
      applications,
      receivedUnresponded,
      sentResponded,
    },
    ref
  ) => {
    const unreadMessages = messages?.length || 0;
    const uncheckedApplications =
      applications?.filter((app) => !app.checked).length || 0;

    // Close on ESC
    useEffect(() => {
      if (!open) return;
      const onKey = (e) => e.key === "Escape" && onClose?.();
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    const getInitials = (user) => {
      if (!user) return "A";
      return (
        (user.first_name?.[0] ?? "").toUpperCase() +
        (user.last_name?.[0] ?? "").toUpperCase()
      );
    };

    return (
      <>
        {/* Backdrop */}
        <div
          className={`sidebar-backdrop ${open ? "show" : ""}`}
          onClick={onClose}
          aria-hidden={!open}
        />

        <aside
          ref={ref}
          className={`notifications-sidebar ${open ? "open" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="Notifications"
        >
          {/* Header */}
          <div className="sidebar-header">
            <h5 className="mb-0">Notifications</h5>
            <button
              className="close-btn"
              onClick={onClose}
              aria-label="Close notifications"
              title="Close"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="sidebar-content">
            {/* Messages */}
            <section className="notif-section" style={{ paddingTop: "10px" }}>
              <div className="notif-section-head">
                <h6 className="mb-0">Unread Messages</h6>
                <span className="chip">{unreadMessages}</span>
              </div>

              {unreadMessages === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-chat-left-text"></i>
                  <div>No unread messages</div>
                </div>
              ) : (
                <ul className="notif-list">
                  {messages.slice(0, 5).map((msg) => (
                    <li key={msg.id}>
                      <Link
                        to={`/conversations/${msg.conversation}`}
                        className="notification-item"
                        onClick={onClose}
                      >
                        <div className="notif-icon">
                          <div className="notif-avatar">
                            {getInitials(msg.sender)}
                          </div>
                        </div>
                        <div className="notif-body">
                          <div className="notif-title">
                            <strong>{msg.sender?.first_name}</strong>
                            <span className="notif-dot" aria-hidden>
                              •
                            </span>
                            <span className="muted">Message</span>
                          </div>
                          <div className="notif-text">
                            {msg.content.length > 64
                              ? msg.content.slice(0, 64) + "…"
                              : msg.content}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Applications */}
            <section className="notif-section">
              <div className="notif-section-head">
                <h6 className="mb-0">Applications to Check</h6>
                <span className="chip">{uncheckedApplications}</span>
              </div>

              {uncheckedApplications === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-clipboard-check"></i>
                  <div>No new applications</div>
                </div>
              ) : (
                <ul className="notif-list">
                  {applications
                    .filter((app) => !app.checked)
                    .slice(0, 5)
                    .map((app) => (
                      <li key={app.id}>
                        <Link
                          to={`/groups/${app.id}`}
                          className="notification-item"
                          onClick={onClose}
                        >
                          <div className="notif-icon icon-doc">📄</div>
                          <div className="notif-body">
                            <div className="notif-title">
                              <strong>Group</strong>
                              <span className="notif-dot" aria-hidden>
                                •
                              </span>
                              <span className="muted">Application</span>
                            </div>
                            <div className="notif-text">
                              {app.name || "Unnamed group"}
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                </ul>
              )}
            </section>

            {/* Received Invitations */}
            <section className="notif-section">
              <div className="notif-section-head">
                <h6 className="mb-0">Received Invitations</h6>
                <span className="chip">{receivedUnresponded?.length || 0}</span>
              </div>

              {!receivedUnresponded || receivedUnresponded.length === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-envelope"></i>
                  <div>No unresponded invitations</div>
                </div>
              ) : (
                <ul className="notif-list">
                  {receivedUnresponded.slice(0, 5).map((inv) => (
                    <li key={inv.id}>
                      <Link
                        to="/groups/invitations"
                        className="notification-item"
                        onClick={onClose}
                      >
                        <div className="notif-icon icon-invite">✉️</div>
                        <div className="notif-body">
                          <div className="notif-title">
                            <strong>From:</strong>&nbsp;
                            {inv.invited_by_email}
                          </div>
                          <div className="notif-text">
                            Group: {inv.group_name}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Sent Invitations */}
            <section className="notif-section">
              <div className="notif-section-head">
                <h6 className="mb-0">Sent Invitations</h6>
                <span className="chip">{sentResponded?.length || 0}</span>
              </div>

              {!sentResponded || sentResponded.length === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-send"></i>
                  <div>No responded invitations</div>
                </div>
              ) : (
                <ul className="notif-list">
                  {sentResponded.slice(0, 5).map((inv) => (
                    <li key={inv.id}>
                      <Link
                        to="/groups/invitations"
                        className="notification-item"
                        onClick={onClose}
                      >
                        <div className="notif-icon icon-sent">📬</div>
                        <div className="notif-body">
                          <div className="notif-title">
                            <strong>To:</strong>&nbsp;{inv.invited_user_email}
                          </div>
                          <div className="notif-text">
                            Status: {inv.accepted ? "Accepted" : "Declined"}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </aside>
      </>
    );
  }
);

export default NotificationSidebar;
