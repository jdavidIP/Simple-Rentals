import { createContext, useState, useContext, useEffect } from "react";
import api from "../api";

const ProfileContext = createContext();

export const useProfileContext = () => useContext(ProfileContext);

export const ProfileProvider = ({ children }) => {
  // Data states
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [applications, setApplications] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [roommate, setRoommate] = useState(null);

  // Loading states
  const [profileLoading, setProfileLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [roommateLoading, setRoommateLoading] = useState(false);

  // Error states
  const [profileError, setProfileError] = useState(null);
  const [messagesError, setMessagesError] = useState(null);
  const [applicationsError, setApplicationsError] = useState(null);
  const [invitationsError, setInvitationsError] = useState(null);
  const [roommateError, setRoommateError] = useState(null);

  const fetchUser = async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const response = await api.get("/profile/me");
      setProfile(response.data);
    } catch (err) {
      setProfile(null);
      setProfileError("Failed to fetch user.");
      console.error("Failed to fetch user.", err);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchMessages = async () => {
    setMessagesLoading(true);
    setMessagesError(null);
    try {
      const response = await api.get("/messages");
      setMessages(response.data);
    } catch (err) {
      setMessages([]);
      setMessagesError("Failed to fetch messages.");
      console.error("Failed to fetch messages.", err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchApplications = async () => {
    setApplicationsLoading(true);
    setApplicationsError(null);
    try {
      const response = await api.get("/applications");
      setApplications(response.data);
    } catch (err) {
      setApplications([]);
      setApplicationsError("Failed to fetch applications.");
      console.error("Failed to fetch applications.", err);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const fetchInvitations = async () => {
    setInvitationsLoading(true);
    setInvitationsError(null);
    try {
      const response = await api.get("/groups/invitations");
      setInvitations(response.data);
    } catch (err) {
      setInvitations([]);
      setInvitationsError("Failed to fetch invitations.");
      console.error("Failed to fetch invitations.", err);
    } finally {
      setInvitationsLoading(false);
    }
  };

  const fetchRoommate = async () => {
    setRoommateLoading(true);
    setRoommateError(null);
    try {
      const response = await api.get(`/roommates/${profile.roommate_profile}`);
      setRoommate(response.data);
    } catch (err) {
      setRoommate(null);
      setRoommateError("Failed to fetch roommate profile.");
      console.error("Failed to fetch roommate profile.", err);
    } finally {
      setRoommateLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    const handler = () => fetchUser();
    window.addEventListener("user-logged-in", handler);
    return () => window.removeEventListener("user-logged-in", handler);
  }, []);

  useEffect(() => {
    if (profile) {
      fetchMessages();
      fetchApplications();
      fetchInvitations();
      fetchRoommate();
    }
  }, [profile]);

  const isProfileSelf = (id) => profile && id === profile.id;
  const isRoommateSelf = (id) => profile && profile.roommate_profile == id;

  const value = {
    profile,
    profileLoading,
    profileError,
    messages,
    messagesLoading,
    messagesError,
    applications,
    applicationsLoading,
    applicationsError,
    invitations,
    invitationsLoading,
    invitationsError,
    roommate,
    roommateLoading,
    roommateError,
    isProfileSelf,
    isRoommateSelf,
    fetchUser,
    fetchMessages,
    fetchApplications,
    fetchInvitations,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};
