import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import "./login.css";

const Profile = () => {
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return navigate("/login");

        const adminRef = doc(db, "admins", user.uid);
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists()) {
          setAdminData(adminSnap.data());
        } else {
          console.error("Admin document not found.");
        }
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2 className="login-title">Loading profile...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Profile</h2>
        <div className="profile-details">
          <p>
            <strong>Name:</strong> {adminData?.name || "N/A"}
          </p>
          <p>
            <strong>Email:</strong> {adminData?.email || "N/A"}
          </p>
          <p>
            <strong>Role:</strong> {adminData?.type || "admin"}
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
