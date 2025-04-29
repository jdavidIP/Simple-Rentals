import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/Chat.css";

function ConversationList() {
  const [conversations, setConversations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/conversations/")
      .then((response) => setConversations(response.data))
      .catch((error) => console.error("Error fetching conversations:", error));
  }, []);

  const handleConversationClick = (id) => {
    navigate(`/conversations/${id}`);
  };

  return (
    <div className="chat-container">
      <h2>Your Conversations</h2>
      {conversations.length === 0 && <p>No conversations found.</p>}
      <ul className="conversation-list">
        {conversations.map((conv) => (
          <li key={conv.id} className="conversation-item" onClick={() => handleConversationClick(conv.id)}>
            <div className="conversation-header">
              <strong>Listing:</strong> {conv.listing.street_address}
            </div>
            <div className="conversation-meta">
              <small><strong>Last updated:</strong> {new Date(conv.last_updated).toLocaleString()}</small>
              {conv.last_message && (
                <div className="last-message">
                  <strong>Last message:</strong> {conv.last_message.content}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ConversationList;