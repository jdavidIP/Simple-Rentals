import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import "../../styles/chat.css";
import { useProfileContext } from "../../contexts/ProfileContext";
import ListingCard from "../../components/cards/ListingCard";

function ConversationWindow() {
  const { conversationId } = useParams();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isProfileSelf } = useProfileContext();
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const fetchConversation = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/conversations/${conversationId}/`);
      setConversation(response.data);
      setMessages(response.data.messages || []);

      const primaryImage = response.data.listing.pictures?.find(
        (p) => p.is_primary
      );

      const processed = {
        ...response.data.listing,
        primary_image: primaryImage,
      };

      setListing(processed);
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
  const collapseNames = (names, max = 4) => {
    if (names.length <= max) return names.join(", ");
    return `${names.slice(0, max - 1).join(", ")}, ${names[max - 1]} +${
      names.length - max
    } more`;
  };

  const chatTitle = useMemo(() => {
    if (!conversation) return "Conversation";

    const participants = conversation.participants || [];

    // Exclude my own profile
    const names = participants
      .filter((u) => !isProfileSelf(u.id))
      .map((u) => u.full_name);

    if (names.length === 0) return "Conversation";

    return names.length > 4 ? collapseNames(names) : names.join(", ");
  }, [conversation, isProfileSelf]);

  return (
    <div className="chat-page-container">
      {/* Sidebar listing preview */}
      {conversation?.listing && (
        <aside className="chat-sidebar">
          <div className="sidebar-panel">
            <h4 className="sidebar-title">Listing Preview</h4>
            <ListingCard
              listing={listing}
              styling={true}
              showFavourite={true}
            />
          </div>
        </aside>
      )}

      <div className="chat-main">
        <header className="chat-header">
          <h2 className="chat-title">{chatTitle}</h2>
          {conversation && (
            <p className="chat-listing">
              <strong>Listing:</strong> {conversation.listing.street_address}
            </p>
          )}
        </header>

        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : conversation ? (
          <>
            <main className="chat-messages" aria-live="polite">
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
                    {/* Avatar for others (clickable) */}
                    {!isMine && (
                      <div
                        className="chat-avatar"
                        title={`${msg.sender.first_name} ${msg.sender.last_name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/profile/${msg.sender.id}`);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        {msg.sender.profile_picture ? (
                          <img
                            src={msg.sender.profile_picture}
                            alt={`${msg.sender.first_name} ${msg.sender.last_name}`}
                            className="chat-avatar-img"
                          />
                        ) : (
                          <span className="chat-avatar-fallback">
                            {getInitials(msg.sender)}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="chat-bubble">
                      <p className="chat-content">
                        <strong>{msg.sender.first_name}:</strong> {msg.content}
                      </p>
                      <small className="chat-timestamp">
                        {new Date(msg.timestamp).toLocaleString()}
                      </small>
                    </div>

                    {/* My avatar */}
                    {isMine && (
                      <div className="chat-avatar mine-avatar" title="You">
                        {msg.sender.profile_picture ? (
                          <img
                            src={msg.sender.profile_picture}
                            alt="You"
                            className="chat-avatar-img"
                          />
                        ) : (
                          <span className="chat-avatar-fallback">
                            {getInitials(msg.sender)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </main>

            <div className="chat-input-section">
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
              />
              <button
                className="chat-send-button"
                onClick={handleSendMessage}
                disabled={loading || !newMessage.trim()}
              >
                <svg viewBox="0 0 24 24" className="icon-send">
                  <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <div>No conversation found.</div>
        )}
      </div>
    </div>
  );
}

export default ConversationWindow;
