import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import "../styles/Chat.css";
import { useProfileContext } from "../contexts/ProfileContext";

function ConversationWindow() {
  const { conversationId } = useParams();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const { isProfileSelf } = useProfileContext();

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

  useEffect(() => {
    fetchConversation();
  }, [conversationId]);

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
    return <div className="chat-container">Loading conversation...</div>;
  }

  return (
    <div className="chat-container">
      <h2>Conversation</h2>
      {conversation && (
        <>
          <p className="chat-listing">
            <strong>Listing:</strong> {conversation.listing.street_address}
          </p>
          <div className="chat-members mb-3">
            <strong>Members:</strong>{" "}
            {conversation.participants &&
            conversation.participants.length > 0 ? (
              conversation.participants.map((user, idx) => (
                <span key={user.id}>
                  {user.first_name} {user.last_name}
                  {idx < conversation.participants.length - 1 ? ", " : ""}
                </span>
              ))
            ) : (
              <span>No members</span>
            )}
          </div>
        </>
      )}
      <div className="chat-messages">
        {messages.map((msg) => {
          const isMine = isProfileSelf(msg.sender.id);
          return (
            <div
              key={msg.id}
              className={`chat-message ${isMine ? "mine" : "theirs"}`}
            >
              <div className="chat-bubble">
                <p>
                  <strong>{msg.sender.first_name}:</strong> {msg.content}
                </p>
                <small className="chat-timestamp">
                  {new Date(msg.timestamp).toLocaleString()}
                </small>
              </div>
            </div>
          );
        })}
      </div>
      <div className="chat-input-section">
        <textarea
          rows="3"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="chat-textarea"
        />
        <button className="chat-send-button" onClick={handleSendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}

export default ConversationWindow;
