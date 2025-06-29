import { createContext, useState, useContext, useEffect } from "react";
import api from "../api"; // Make sure this import is present

const ProfileContext = createContext();

export const useProfileContext = () => {
  return useContext(ProfileContext);
};

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [applications, setApplications] = useState([]);
  const [invitations, setInvitations] = useState([]);

  const fetchUser = async () => {
    try {
      const response = await api.get("/profile/me");
      setProfile(response.data);
    } catch (err) {
      console.error("Failed to fetch user.", err);
      setProfile(null);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await api.get("/messages");
      setMessages(response.data);
    } catch (err) {
      console.error("Failed to fetch messages.", err);
      setMessages([]);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await api.get("/applications");
      setApplications(response.data);
    } catch (err) {
      console.error("Failed to fetch applications.", err);
      setApplications([]);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await api.get("/groups/invitations");
      setInvitations(response.data);
    } catch (err) {
      console.error("Failed to fecth invitations.", err);
      setInvitations([]);
    }
  };

  useEffect(() => {
    fetchUser();
    // Listen for login event
    const handler = () => fetchUser();
    window.addEventListener("user-logged-in", handler);
    return () => window.removeEventListener("user-logged-in", handler);
  }, []);

  useEffect(() => {
    if (profile) {
      fetchMessages();
      fetchApplications();
      fetchInvitations();
    }
  }, [profile]);

  const isProfileSelf = (id) => {
    return profile && id === profile.id;
  };

  const isRoommateSelf = (id) => {
    return profile && profile.roommate_profile == id;
  };

  const value = {
    profile,
    applications,
    messages,
    invitations,
    isProfileSelf,
    isRoommateSelf,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};
