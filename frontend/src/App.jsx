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

function App() {
  return (
    <Router>
      <Routes>
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
