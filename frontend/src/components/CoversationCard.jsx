import { useProfileContext } from "../contexts/ProfileContext";
import { useNavigate } from "react-router-dom";
import "../styles/Chat.css";
import api from "../api";

function ConversationCard({ conv, onUpdate }) {
  const { profile } = useProfileContext();
  const navigate = useNavigate();
  const participantCount = conv.participants.length;
  const isOnlyUser =
    participantCount === 1 && conv.participants[0] === profile.id;

  const handleLeave = async (convId) => {
    try {
      await api.post(`/conversations/leave/${convId}`);
      if (onUpdate) onUpdate(); // Call the passed function
    } catch (err) {
      alert("Failed to leave conversation.");
    }
  };

  const handleDelete = async (convId) => {
    try {
      await api.delete(`/conversations/delete/${convId}`);
      if (onUpdate) onUpdate(); // Call the passed function
    } catch (err) {
      alert("Failed to delete conversation.");
    }
  };

  return (
    <li
      key={conv.id}
      className="conversation-item"
      onClick={() => navigate(`/conversations/${conv.id}`)}
      style={{ position: "relative" }}
    >
      <div className="conversation-header">
        <strong>Listing:</strong> {conv.listing.street_address}
      </div>
      <div className="conversation-meta">
        <small>
          <strong>Last updated:</strong>{" "}
          {new Date(conv.last_updated).toLocaleString()}
        </small>
        {conv.last_message && (
          <div className="last-message">
            <strong>Last message:</strong> {conv.last_message.content}
          </div>
        )}
      </div>
      {!conv.isGroup && (
        <button
          className={
            isOnlyUser
              ? "conversation-action-btn conversation-delete-btn"
              : "conversation-action-btn conversation-leave-btn"
          }
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 2,
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (
              window.confirm(
                isOnlyUser
                  ? "Are you sure you want to delete this conversation?"
                  : "Are you sure you want to leave this conversation?"
              )
            ) {
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
