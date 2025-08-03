import { useProfileContext } from "../../contexts/ProfileContext";
import { useNavigate } from "react-router-dom";
import "../../styles/chat.css";
import api from "../../api";

function ConversationCard({ conv, onUpdate }) {
  const { profile } = useProfileContext();
  const navigate = useNavigate();
  const myId = profile?.id;

  const otherUsers = conv.participants.filter((u) => u.id !== myId);

  let participantsTitle = "Conversation";
  if (otherUsers.length > 0) {
    const shown = otherUsers.slice(0, 4).map((user) => user.full_name);
    const extraCount = otherUsers.length - shown.length;
    participantsTitle =
      shown.join(", ") + (extraCount > 0 ? ` +${extraCount} more` : "");
  }

  const unreadCount = Array.isArray(conv.messages)
    ? conv.messages.filter((m) => m.sender?.id !== myId && m.read === false)
        .length
    : 0;

  const isOnlyUser =
    conv.participants === 1 && conv.participants[0].id === myId;

  const handleLeave = async (convId) => {
    try {
      await api.post(`/conversations/leave/${convId}`);
      onUpdate?.();
    } catch (_err) {
      alert("Failed to leave conversation.");
    }
  };

  const handleDelete = async (convId) => {
    try {
      await api.delete(`/conversations/delete/${convId}`);
      onUpdate?.();
    } catch (_err) {
      alert("Failed to delete conversation.");
    }
  };

  return (
    <li
      key={conv.id}
      className={`conversation-item ${unreadCount > 0 ? "unread" : ""}`}
      onClick={() => navigate(`/conversations/${conv.id}`)}
    >
      {/* Title row: participants + unread badge */}
      <div className="conversation-title-row">
        <div className="conversation-header title-text">
          {participantsTitle}
        </div>
        {unreadCount > 0 && (
          <span className="unread-badge" title={`${unreadCount} unread`}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>

      {/* Secondary line: listing */}
      {conv.listing?.street_address && (
        <div className="conversation-sub">
          <small className="text-muted">
            <strong>Listing:</strong> {conv.listing.street_address}
          </small>
        </div>
      )}

      {/* Meta + last message (one-line clamp) */}
      <div className="conversation-meta">
        <small className="text-muted">
          Last updated: {new Date(conv.last_updated).toLocaleString()}
        </small>
        {conv.last_message && (
          <div
            className={`last-message ${
              unreadCount > 0 ? "last-message-unread" : ""
            }`}
            title={conv.last_message.content}
          >
            {conv.last_message.content}
          </div>
        )}
      </div>

      {/* Action pill (leave/delete) */}
      {!conv.isGroup && (
        <button
          className={
            isOnlyUser
              ? "conversation-action-btn conversation-delete-btn"
              : "conversation-action-btn conversation-leave-btn"
          }
          style={{ position: "absolute", top: 16, right: 16 }}
          onClick={(e) => {
            e.stopPropagation();
            const confirmText = isOnlyUser
              ? "Are you sure you want to delete this conversation?"
              : "Are you sure you want to leave this conversation?";
            if (window.confirm(confirmText)) {
              isOnlyUser ? handleDelete(conv.id) : handleLeave(conv.id);
            }
          }}
        >
          {isOnlyUser ? "Delete" : "Leave"}
        </button>
      )}
    </li>
  );
}

export default ConversationCard;
