import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

function ConversationWindow({ isAuthorized }) {
  const { conversationId } = useParams();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true); // Optional: loading state

  useEffect(() => {
    if (!isAuthorized) return;

    const fetchConversation = async () => {
      try {
        const response = await api.get(`/conversations/${conversationId}/`);
        setConversation(response.data);
        setMessages(response.data.messages || []);
      } catch (error) {
        console.error("Error fetching conversation:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [conversationId, isAuthorized]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await api.post(
        `/conversations/${conversationId}/send_message/`,
        { content: newMessage }
      );
      setMessages((prev) => [...prev, response.data]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading) {
    return <div>Loading conversation...</div>;
  }

  return (
    <div>
      <h2>Conversation Details</h2>
      {conversation && (
        <div>
          <p>
            <strong>Listing:</strong> {conversation.listing.street_address}
          </p>
        </div>
      )}
      <div
        style={{
          border: "1px solid #ccc",
          padding: "1rem",
          height: "300px",
          overflowY: "scroll",
          marginBottom: "1rem",
        }}
      >
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.sender.first_name}:</strong> {msg.content}
            <br />
            <small>{new Date(msg.timestamp).toLocaleString()}</small>
            <hr />
          </div>
        ))}
      </div>
      <div>
        <textarea
          rows="3"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
        ></textarea>
        <br />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}

export default ConversationWindow;