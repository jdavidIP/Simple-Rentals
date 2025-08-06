import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Home from "./pages/util/Home";
import NotFound from "./pages/util/NotFound";
import Logout from "./pages/auth/Logout";
import ListingsHome from "./pages/listing/ListingsHome";
import Listings from "./pages/listing/Listings";
import ListingsView from "./pages/listing/ListingsView";
import ListingsPost from "./pages/listing/ListingsPost";
import ListingsEdit from "./pages/listing/ListingsEdit";
import ProtectedRoute from "./components/ProtectedRoute";
import ConversationList from "./pages/conversation/ConversationList";
import ConversationWindow from "./pages/conversation/ConversationWindow";
import Profile from "./pages/profile/Profile";
import Reviews from "./pages/review/Reviews";
import ProfileEdit from "./pages/profile/ProfileEdit";
import Layout from "./components/Layout";
import RoommatesHome from "./pages/roommate/RoommatesHome";
import RoommatesPost from "./pages/roommate/RoommatesPost";
import RoommatesView from "./pages/roommate/RoommatesView";
import Groups from "./pages/group/Groups";
import GroupPost from "./pages/group/GroupsPost";
import GroupView from "./pages/group/GroupView";
import GroupEdit from "./pages/group/GroupEdit";
import { ProfileProvider } from "./contexts/ProfileContext";
import RoommatesEdit from "./pages/roommate/RoommatesEdit";
import Applications from "./pages/group/Applications";
import GroupManage from "./pages/group/GroupManage";
import Invitations from "./pages/group/Invitations";
import ReviewsEdit from "./pages/review/ReviewsEdit";
import VerifyPending from "./pages/auth/VerifyPending";
import VerifyEmail from "./pages/auth/VerifyEmail";
import AuthLayout from "./components/AuthLayout";
import ResetPassword from "./pages/auth/ResetPassword";
import RequestPasswordReset from "./pages/auth/RequestPasswordReset";
import "./styles/global.css";

function App() {
  return (
    <Router>
      <ProfileProvider>
        <Routes>
          {/* Main site layout with header/footer */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/listings" element={<ListingsHome />} />
            <Route path="/listings/results" element={<Listings />} />
            <Route path="/listings/:id" element={<ListingsView />} />

            <Route
              path="/listings/post"
              element={
                <ProtectedRoute>
                  <ListingsPost />
                </ProtectedRoute>
              }
            />
            <Route
              path="/listings/edit/:id"
              element={
                <ProtectedRoute>
                  <ListingsEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/listings/:id/groups"
              element={
                <ProtectedRoute>
                  <Groups />
                </ProtectedRoute>
              }
            />
            <Route
              path="/listings/:id/groups/post"
              element={
                <ProtectedRoute>
                  <GroupPost />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/:id"
              element={
                <ProtectedRoute>
                  <GroupView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/edit/:id"
              element={
                <ProtectedRoute>
                  <GroupEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/manage/:id"
              element={
                <ProtectedRoute>
                  <GroupManage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/invitations"
              element={
                <ProtectedRoute>
                  <Invitations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications"
              element={
                <ProtectedRoute>
                  <Applications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:id"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/edit/:id"
              element={
                <ProtectedRoute>
                  <ProfileEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:id/reviews"
              element={
                <ProtectedRoute>
                  <Reviews />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reviews/edit/:id"
              element={
                <ProtectedRoute>
                  <ReviewsEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/conversations"
              element={
                <ProtectedRoute>
                  <ConversationList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/conversations/:conversationId"
              element={
                <ProtectedRoute>
                  <ConversationWindow />
                </ProtectedRoute>
              }
            />
            <Route
              path="/roommates"
              element={
                <ProtectedRoute>
                  <RoommatesHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/roommates/post"
              element={
                <ProtectedRoute>
                  <RoommatesPost />
                </ProtectedRoute>
              }
            />
            <Route
              path="/roommates/edit/:id"
              element={
                <ProtectedRoute>
                  <RoommatesEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/roommates/:id"
              element={
                <ProtectedRoute>
                  <RoommatesView />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Auth-only layout (no header/footer) */}
          <Route element={<AuthLayout />}>
            <Route path="/verify-pending" element={<VerifyPending />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-password-request" element={<RequestPasswordReset />} />
          </Route>
        </Routes>
      </ProfileProvider>
    </Router>
  );
}

export default App;
