import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/navbar";
import Footer from "./components/footer";
import Home from "./pages/home";
import Login from "./pages/login";
import SignUp from "./pages/signup";
import Profile from "./pages/profile";
import Reports from "./pages/Reports";
import UserTracking from "./pages/UserTracking";
import GarageLayout from "./pages/GarageLayout";
import GarageDetails from "./pages/GarageDetails";
import Payments from "./pages/payments";
import Reviews from "./pages/reviews";
import Statistics from "./pages/Statistics";
import CarScanner from "./pages/CarScanner";
import GenerateCVLayout from "./pages/GenerateCVLayout";
import SlotJsonGenerator from "./pages/SlotJsonGenerator";
import ProtectedRoute from "./components/protectedroute";

import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

function AppContent() {
  const location = useLocation();
  const hideUIPaths = ["/", "/login", "/signup"];
  const shouldHideSidebar = hideUIPaths.includes(location.pathname);

  return (
    <div className="app-container">
      {!shouldHideSidebar && <Navbar />}
      <div className={`main-content ${shouldHideSidebar ? "full-width" : ""}`}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/garage-details" element={<GarageDetails />} />

          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/scan-car" element={<ProtectedRoute><CarScanner /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/user-tracking" element={<ProtectedRoute><UserTracking /></ProtectedRoute>} />
          <Route path="/garage-layout" element={<ProtectedRoute><GarageLayout /></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
          <Route path="/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
          <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />

          <Route path="/generate-cv-layout" element={<ProtectedRoute><GenerateCVLayout /></ProtectedRoute>} />
          <Route path="/slot-json-gen" element={<ProtectedRoute><SlotJsonGenerator /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
