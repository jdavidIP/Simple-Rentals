import React, { useState, useEffect } from "react";
import api from "../../api";
import ConversationCard from "../../components/cards/ConversationCard";
import "../../styles/chat.css";

function ConversationList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <header className="chat-header">
        <h2 className="chat-title mb-0">Your Conversations</h2>
        <p className="chat-listing mb-0">{conversations?.length || 0} total</p>
      </header>

      {error ? (
        <div className="alert alert-danger m-3">{error}</div>
      ) : loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : conversations.length > 0 ? (
        <ul className="conversation-list">
          {conversations.map((conv) => (
            <ConversationCard
              key={conv.id}
              conv={conv}
              onUpdate={fetchConversations}
            />
          ))}
        </ul>
      ) : (
        <p className="m-3 text-muted">No conversations found.</p>
      )}
    </div>
  );
}

export default ConversationList;
