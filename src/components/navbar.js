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
  FaCamera,
} from "react-icons/fa";
import "./navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [authChecked, setAuthChecked] = useState(false); // ✅ to control initial render

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
      setAuthChecked(true); // ✅ mark that auth has been evaluated
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
   
    { path: "/payments", label: "Payments", icon: FaCreditCard },
    { path: "/reviews", label: "Reviews", icon: FaComments },
    { path: "/scan-car", label: "Gate Scanner", icon: FaCamera },
    { path: "/profile", label: "Profile", icon: FaUser },
  ];

  // ✅ Don't render anything until auth state is determined
  if (!authChecked) return null;

  // ✅ Hide sidebar if not logged in
  if (!isLoggedIn) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-icon">🅿️</div>
        <span className="brand-text">Garagy</span>
      </div>

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

      <div className="sidebar-footer">
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
      </div>
    </aside>
  );
};

export default Navbar;
