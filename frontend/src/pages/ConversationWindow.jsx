import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import "../styles/chat.css";
import { useProfileContext } from "../contexts/ProfileContext";

function ConversationWindow() {
  const { conversationId } = useParams();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isProfileSelf } = useProfileContext();
  const messagesEndRef = useRef(null);

  const fetchConversation = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/conversations/${conversationId}/`);
      setConversation(response.data);
      setMessages(response.data.messages || []);
    } catch (error) {
      setError("Failed to fetch conversation.");
      console.error("Error fetching conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversation();
  }, [conversationId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const response = await api.post(
        `/conversations/${conversationId}/send_message/`,
        { content: newMessage }
      );
      setMessages((prev) => [...prev, response.data]);
      setNewMessage("");
    } catch (error) {
      setError("Failed to send message.");
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get initials from name
  const getInitials = (user) => {
    if (!user) return "A";
    return (
      (user.first_name?.charAt(0) ?? "") + (user.last_name?.charAt(0) ?? "")
    );
  };

  // Compact a list of names: "Alice, Bob, Carol +2"
  const collapseNames = (names, max = 3) => {
    if (names.length <= max) return names.join(", ");
    return `${names.slice(0, max - 1).join(", ")}, ${names[max - 1]} +${
      names.length - max
    } more`;
  };

  const getFullName = (u) =>
    `${u?.first_name ?? ""} ${u?.last_name ?? ""}`.trim();

  const chatTitle = useMemo(() => {
    if (!conversation) return "Conversation";

    // Prefer participants from conversation payload
    const participants = conversation.participants || [];

    const names = participants.map(getFullName).filter(Boolean);

    console.log(names);

    if (names.length > 4) return collapseNames(names);

    // Fallback: gather unique senders from messages (e.g., if participants missing)
    const uniqueSendersMap = new Map();
    messages.forEach((m) => {
      if (m?.sender) uniqueSendersMap.set(m.sender.id, m.sender);
    });
    const uniqueOthers = Array.from(uniqueSendersMap.values());
    const fallbackNames = uniqueOthers.map(getFullName).filter(Boolean);

    return fallbackNames.length ? collapseNames(fallbackNames) : "Conversation";
  }, [conversation, messages, isProfileSelf]);

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h2 className="chat-title">{chatTitle}</h2>
        {conversation && (
          <p className="chat-listing">
            <strong>Listing:</strong> {conversation.listing.street_address}
          </p>
        )}
      </header>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading && (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      )}

      {!loading && conversation && (
        <>
          <main
            className="chat-messages"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.length === 0 && (
              <div className="chat-no-messages">
                No messages yet. Start the conversation!
              </div>
            )}
            {messages.map((msg) => {
              const isMine = isProfileSelf(msg.sender.id);
              return (
                <div
                  key={msg.id}
                  className={`chat-message ${isMine ? "mine" : "theirs"}`}
                  aria-label={`${msg.sender.first_name} said: ${msg.content}`}
                >
                  {!isMine && (
                    <div
                      className="chat-avatar"
                      title={`${msg.sender.first_name} ${msg.sender.last_name}`}
                    >
                      {getInitials(msg.sender)}
                    </div>
                  )}

                  <div className="chat-bubble">
                    <p className="chat-content">
                      <strong>{msg.sender.first_name}:</strong> {msg.content}
                    </p>
                    <small className="chat-timestamp" aria-hidden="true">
                      {new Date(msg.timestamp).toLocaleString()}
                    </small>
                  </div>

                  {isMine && (
                    <div className="chat-avatar mine-avatar" title="You">
                      {getInitials(msg.sender)}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </main>

          <footer className="chat-input-section">
            <textarea
              rows={2}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="chat-textarea"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              aria-label="Message input"
            />
            <button
              className="chat-send-button"
              onClick={handleSendMessage}
              disabled={loading || !newMessage.trim()}
              aria-label="Send message"
              title="Send"
            >
              {/* Paper-plane icon */}
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
                className="icon-send"
              >
                <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </footer>
        </>
      )}

      {!loading && !conversation && <div>No conversation found.</div>}
    </div>
  );
}

export default ConversationWindow;
