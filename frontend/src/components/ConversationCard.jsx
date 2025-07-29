import { useProfileContext } from "../contexts/ProfileContext";
import { useNavigate } from "react-router-dom";
import "../styles/chat.css";
import api from "../api";

function ConversationCard({ conv, onUpdate }) {
  const { profile } = useProfileContext();
  const navigate = useNavigate();

  const getFullName = (u) =>
    `${u?.first_name ?? ""} ${u?.last_name ?? ""}`.trim();

  // ---- Build participants title from IDs + known user objects ----
  const participantIds = Array.isArray(conv.participants)
    ? conv.participants
    : [];
  const myId = profile?.id;

  // All "other" user IDs (exclude me)
  const otherIds = participantIds.filter((id) => id !== myId);

  // Known user objects we can map: last_message.sender, listing.owner
  const knownUsers = new Map();
  if (conv.last_message?.sender?.id) {
    knownUsers.set(
      conv.last_message.sender.id,
      getFullName(conv.last_message.sender)
    );
  }
  if (conv.listing?.owner?.id) {
    knownUsers.set(conv.listing.owner.id, getFullName(conv.listing.owner));
  }

  // Assemble names we know for those "other" IDs
  const knownNames = otherIds.map((id) => knownUsers.get(id)).filter(Boolean);

  // Compose a compact title
  let participantsTitle = "Conversation";
  if (otherIds.length === 0) {
    participantsTitle = "Conversation";
  } else if (knownNames.length === otherIds.length) {
    // We know all other names
    participantsTitle = knownNames.join(", ");
  } else if (knownNames.length > 0) {
    const unknownCount = otherIds.length - knownNames.length;
    participantsTitle = `${knownNames.join(", ")} +${unknownCount} more`;
  } else {
    // We don't know any names — generic but informative
    participantsTitle = conv.isGroup
      ? `Group (${otherIds.length + 1} participants)` // +1 to include me
      : "Conversation";
  }

  const unreadCount = Array.isArray(conv.messages)
    ? conv.messages.filter((m) => m.sender?.id !== myId && m.read === false)
        .length
    : 0;

  const isOnlyUser = participantIds.length === 1 && participantIds[0] === myId;

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
