import React from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

const Profile = () => {
  const navigate = useNavigate();
  const adminData = JSON.parse(localStorage.getItem("adminData"));

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Profile</h2>
        <div className="profile-details">
          <p>
            <strong>Name:</strong> {adminData?.name}
          </p>
          <p>
            <strong>Email:</strong> {adminData?.email}
          </p>
          <p>
            <strong>Role:</strong> {adminData?.type}
          </p>
        </div>
        <button onClick={() => navigate("/home")} className="login-button">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Profile;
