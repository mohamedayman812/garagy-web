"use client";

import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import {
  FaHome,
  FaUser,
  FaSignOutAlt,
  FaSignInAlt,
  FaParking,
  FaChartBar,
  FaChartLine,
  FaUsers,
  FaCreditCard,
  FaComments,
  FaCamera, // ✅ Added for Car Scanner
} from "react-icons/fa";
import "./navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        setAdminData({
          name: user.displayName || "Admin",
          email: user.email,
        });
      } else {
        setIsLoggedIn(false);
        setAdminData(null);
        localStorage.removeItem("adminData");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    localStorage.clear();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: "/home", label: "Dashboard", icon: FaHome },
    { path: "/garage-layout", label: "Layout", icon: FaParking },
    { path: "/statistics", label: "Statistics", icon: FaChartLine },
    { path: "/reports", label: "Reports", icon: FaChartBar },
    { path: "/user-tracking", label: "Users", icon: FaUsers },
    { path: "/payments", label: "Payments", icon: FaCreditCard },
    { path: "/reviews", label: "Reviews", icon: FaComments },
    { path: "/scan-car", label: "Car Scanner", icon: FaCamera }, // ✅ New nav item
    { path: "/profile", label: "Profile", icon: FaUser },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-icon">🅿️</div>
        <span className="brand-text">Garagy</span>
      </div>

      {isLoggedIn && (
        <nav className="sidebar-nav">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`sidebar-link ${isActive(path) ? "active" : ""}`}
            >
              <Icon className="sidebar-icon" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      )}

      <div className="sidebar-footer">
        {isLoggedIn ? (
          <>
            <div className="admin-info">
              <div className="admin-avatar">
                {adminData?.name?.charAt(0) || "A"}
              </div>
              <div>
                <div className="admin-name">{adminData?.name}</div>
                <div className="admin-role">Administrator</div>
              </div>
            </div>
            <button className="logout-button" onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="login-link">
            <FaSignInAlt /> Login
          </Link>
        )}
      </div>
    </aside>
  );
};

export default Navbar;
