import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/Chat.css";

function ConversationList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await api.get("/conversations/");
      setConversations(response.data);
    } catch (err) {
      setError("Failed to fetch conversations.");
      console.error("Failed to fetch conversations.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  return (
    <div className="chat-container">
      <h2>Your Conversations</h2>
      {error ? (
        <div className="alert alert-danger">{error}</div>
      ) : loading ? (
        <div className="loading">Loading...</div>
      ) : conversations.length > 0 ? (
        <>
          <ul className="conversation-list">
            {conversations.map((conv) => (
              <li
                key={conv.id}
                className="conversation-item"
                onClick={() => navigate(`/conversations/${conv.id}`)}
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
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>No conversations found.</p>
      )}
    </div>
  );
}

export default ConversationList;
