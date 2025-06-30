import React, { useState, useEffect } from "react";
import api from "../api";
import ConversationCard from "../components/CoversationCard";

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
      <h2>Your Conversations</h2>
      {error ? (
        <div className="alert alert-danger">{error}</div>
      ) : loading ? (
        <div className="loading">Loading...</div>
      ) : conversations.length > 0 ? (
        <>
          <ul className="conversation-list">
            {conversations.map((conv) => (
              <ConversationCard
                key={conv.id}
                conv={conv}
                onUpdate={fetchConversations}
              />
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
