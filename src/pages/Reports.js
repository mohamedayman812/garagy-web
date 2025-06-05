import React from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

const Reports = () => {
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Reports</h2>
        <div className="report-list">
          <div className="report-item">
            <p>
              <strong>Report #1:</strong> User complaint about parking space.
            </p>
            <button className="login-button">Reply</button>
          </div>
          <div className="report-item">
            <p>
              <strong>Report #2:</strong> License plate detection issue.
            </p>
            <button className="login-button">Reply</button>
          </div>
        </div>
        <button onClick={() => navigate("/home")} className="login-button">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Reports;
