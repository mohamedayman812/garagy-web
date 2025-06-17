import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; // adjust path if your firebase config is elsewhere
import {
  FaUsers,
  FaSpinner,
  FaPhoneAlt,
  FaCalendarAlt,
  FaWallet,
  FaMoon,
  FaBell,
  FaTimesCircle,
  FaCar,
} from 'react-icons/fa';
import './usertracking.css';

const UserTracking = () => {
  const navigate = useNavigate();
  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1) Redirect to /login if not authenticated
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // 2) Fetch all documents from the "users" collection
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const loadedUsers = [];

        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          loadedUsers.push({
            docId: docSnapshot.id,
            metadata: data.metadata || {},
            payment: data.payment || {},
            personalInfo: data.personalInfo || {},
            settings: data.settings || {},
            vehicles: Array.isArray(data.vehicles) ? data.vehicles : [],
          });
        });

        setUsersList(loadedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="user-tracking-container">
        <div className="loading-card animate-fade-in">
          <FaSpinner className="spinner-icon" />
          <h2 className="loading-text">Loading Users...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="user-tracking-container">
      <div className="user-tracking-card animate-fade-in">
        <h2 className="tracking-title animate-title">
          <FaUsers className="users-icon" /> User Tracking
        </h2>

        {usersList.length === 0 ? (
          <p className="no-users-text">No users found in Firestore.</p>
        ) : (
          <div className="users-grid">
            {usersList.map((user, idx) => {
              // Destructure nested fields with safe defaults
              const {
                metadata: { createdAt: tsCreatedAt, lastLogin: tsLastLogin, id: metadataId },
                payment: { walletBalance = null, savedCards = [] },
                personalInfo: {
                  name = 'Unnamed User',
                  email = 'No email',
                  phoneNumber = null,
                  profilePicture = null,
                },
                settings: {
                  appPrefs: { darkMode = false } = {},
                  notifications: { emailEnabled = false, pushEnabled = false, smsEnabled = false } = {},
                } = {},
                vehicles = [],
              } = user;

              // Convert Firestore Timestamps to JS Date
              const createdAtDate = tsCreatedAt ? new Date(tsCreatedAt.seconds * 1000) : null;
              const lastLoginDate = tsLastLogin ? new Date(tsLastLogin.seconds * 1000) : null;

              return (
                <div
                  key={user.docId}
                  className="user-card animate-card"
                  style={{ animationDelay: `${0.1 * idx}s` }}
                >
                  {/* -------- Personal Info -------- */}
                  <h3 className="user-name">{name}</h3>
                  <p className="user-email">
                    <strong>Email:</strong> {email}
                  </p>
                  {phoneNumber && (
                    <p className="user-phone">
                      <FaPhoneAlt className="icon-small" /> {phoneNumber}
                    </p>
                  )}
                  {profilePicture && (
                    <p className="user-photo">
                      <img
                        src={profilePicture}
                        alt={`${name}'s profile`}
                        className="profile-picture"
                      />
                    </p>
                  )}

                  <hr className="divider" />

                  {/* -------- Metadata -------- */}
                  <p className="user-meta">
                    <strong>UID:</strong> {metadataId || user.docId}
                  </p>
                  {createdAtDate && (
                    <p className="user-meta">
                      <FaCalendarAlt className="icon-small" /> Created:{' '}
                      {createdAtDate.toLocaleDateString()}{' '}
                      {createdAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  {lastLoginDate && (
                    <p className="user-meta">
                      <FaCalendarAlt className="icon-small" /> Last Login:{' '}
                      {lastLoginDate.toLocaleDateString()}{' '}
                      {lastLoginDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}

                  <hr className="divider" />

                  {/* -------- Payment -------- */}
                  <p className="user-wallet">
                    <FaWallet className="icon-small" /> Wallet Balance:{' '}
                    {walletBalance !== null ? `$${walletBalance}` : 'N/A'}
                  </p>
                  {savedCards.length > 0 ? (
                    <p className="user-cards">
                      <strong>Saved Cards:</strong> {savedCards.join(', ')}
                    </p>
                  ) : (
                    <p className="user-cards">
                      <strong>Saved Cards:</strong> None
                    </p>
                  )}

                  <hr className="divider" />

                  {/* -------- Settings -------- */}
                  <div className="user-settings">
                    <p className="user-setting">
                      <FaMoon className="icon-small" /> Dark Mode:{' '}
                      {darkMode ? 'Enabled' : 'Disabled'}
                    </p>
                    <p className="user-setting">
                      <FaBell className="icon-small" /> Notifications:
                    </p>
                    <ul className="notification-list">
                      <li>
                        Email:{' '}
                        {emailEnabled ? (
                          <FaBell className="icon-tick" />
                        ) : (
                          <FaTimesCircle />
                        )}
                      </li>
                      <li>
                        Push:{' '}
                        {pushEnabled ? (
                          <FaBell className="icon-tick" />
                        ) : (
                          <FaTimesCircle />
                        )}
                      </li>
                      <li>
                        SMS:{' '}
                        {smsEnabled ? (
                          <FaBell className="icon-tick" />
                        ) : (
                          <FaTimesCircle />
                        )}
                      </li>
                    </ul>
                  </div>

                  <hr className="divider" />

                  {/* -------- Vehicles -------- */}
                  <div className="user-vehicles">
                    <h4 className="vehicles-title">
                      <FaCar className="icon-small" /> Vehicles
                    </h4>
                    {vehicles.length === 0 ? (
                      <p className="no-vehicles-text">No vehicles registered.</p>
                    ) : (
                      <ul className="vehicle-list">
                        {vehicles.map((veh, i) => {
                          const { id: vehId, licensePlate, make, model, year } = veh;
                          return (
                            <li key={vehId || i} className="vehicle-item">
                              <p>
                                <strong>Plate:</strong> {licensePlate || '—'}
                              </p>
                              <p>
                                <strong>Make:</strong> {make || '—'} / <strong>Model:</strong>{' '}
                                {model || '—'}
                              </p>
                              <p>
                                <strong>Year:</strong> {year || '—'}
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserTracking;
