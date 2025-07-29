import React from "react";
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
    const unreadMessages = messages.length;
    const uncheckedApplications = applications.filter(
      (app) => !app.checked
    ).length;

    return (
      <div ref={ref} className={`notifications-sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-header">
          <h5>Notifications</h5>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="sidebar-content">
          <section>
            <h6>Unread Messages</h6>
            {unreadMessages === 0 ? (
              <p className="text-muted small">No unread messages</p>
            ) : (
              messages.slice(0, 5).map((msg) => (
                <a
                  key={msg.id}
                  href={`/conversations/${msg.conversation}`}
                  className="notification-item"
                >
                  <strong>{msg.sender?.first_name}:</strong>{" "}
                  {msg.content.length > 40
                    ? msg.content.slice(0, 40) + "..."
                    : msg.content}
                </a>
              ))
            )}
          </section>

          <section>
            <h6>Applications to Check</h6>
            {uncheckedApplications === 0 ? (
              <p className="text-muted small">No new applications</p>
            ) : (
              applications
                .filter((app) => !app.checked)
                .slice(0, 5)
                .map((app) => (
                  <a
                    key={app.id}
                    href={`/groups/${app.id}`}
                    className="notification-item"
                  >
                    <strong>Group:</strong> {app.name || "N/A"}
                  </a>
                ))
            )}
          </section>

          <section>
            <h6>Received Invitations</h6>
            {receivedUnresponded.length === 0 ? (
              <p className="text-muted small">No unresponded invitations</p>
            ) : (
              receivedUnresponded.slice(0, 5).map((inv) => (
                <a
                  key={inv.id}
                  href="/groups/invitations"
                  className="notification-item"
                >
                  <strong>From:</strong> {inv.invited_by_email}
                  <br />
                  <strong>Group:</strong> {inv.group_name}
                </a>
              ))
            )}
          </section>

          <section>
            <h6>Sent Invitations</h6>
            {sentResponded.length === 0 ? (
              <p className="text-muted small">No responded invitations</p>
            ) : (
              sentResponded.slice(0, 5).map((inv) => (
                <a
                  key={inv.id}
                  href="/groups/invitations"
                  className="notification-item"
                >
                  <strong>To:</strong> {inv.invited_user_email}
                  <br />
                  <strong>Status:</strong>{" "}
                  {inv.accepted ? "Accepted" : "Declined"}
                </a>
              ))
            )}
          </section>
        </div>

        {/* Footer with “View all” links */}
        <div className="sidebar-footer">
          <a href="/conversations" className="view-all-link">
            View all messages
          </a>
          <a href="/applications" className="view-all-link">
            View all groups
          </a>
          <a href="/groups/invitations" className="view-all-link">
            View all invitations
          </a>
        </div>
      </div>
    );
  }
);

export default NotificationSidebar;
