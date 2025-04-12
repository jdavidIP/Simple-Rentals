import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

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
    <div>
      <h2>Your Conversations</h2>
      {conversations.length === 0 && <p>No conversations found.</p>}
      <ul>
        {conversations.map((conv) => (
          <li key={conv.id} onClick={() => handleConversationClick(conv.id)} style={{ cursor: "pointer" }}>
            <strong>Listing:</strong> {conv.listing.street_address} <br />
            <strong>Last updated:</strong> {new Date(conv.last_updated).toLocaleString()} <br />
            {conv.last_message && (
              <div>
                <strong>Last message:</strong> {conv.last_message.content}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ConversationList;