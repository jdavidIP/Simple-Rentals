import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Logout from "./pages/Logout";
import ListingsHome from "./pages/ListingsHome";
import Listings from "./pages/Listings";
import ListingsView from "./pages/ListingsView";
import ListingsPost from "./pages/ListingsPost";
import ListingsEdit from "./pages/ListingsEdit";
import ProtectedRoute from "./components/ProtectedRoute";
import ConversationList from "./pages/ConversationList";
import ConversationWindow from "./pages/ConversationWindow";
import Profile from "./pages/Profile";
import Reviews from "./pages/Reviews";
import ProfileEdit from "./pages/ProfileEdit";
import Layout from "./components/Layout";
import RoommatesHome from "./pages/RoommatesHome";
import RoommatesPost from "./pages/RoommatesPost";
import RoommatesView from "./pages/RoommatesView";
import Groups from "./pages/Groups";
import GroupPost from "./pages/GroupsPost";
import GroupView from "./pages/GroupView";
import GroupEdit from "./pages/GroupEdit";
import { ProfileProvider } from "./contexts/ProfileContext";
import RoommatesEdit from "./pages/RoommatesEdit";
import Applications from "./pages/Applications";
import GroupManage from "./pages/GroupManage";

function App() {
  return (
    <ProfileProvider>
      <Router>
        <Routes>
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
        </Routes>
      </Router>
    </ProfileProvider>
  );
}

export default App;
