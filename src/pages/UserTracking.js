import React from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

const UserTracking = () => {
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">User Tracking</h2>
        <div className="user-list">
          <div className="user-item">
            <p>
              <strong>User #1:</strong> Mohamed - Active
            </p>
          </div>
          <div className="user-item">
            <p>
              <strong>User #2:</strong> Ahmed - Inactive
            </p>
          </div>
        </div>
        <button onClick={() => navigate("/home")} className="login-button">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default UserTracking;
