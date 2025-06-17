import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import {
  collection,
  getDoc,
  getDocs,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  FaUsers, FaSpinner, FaPhoneAlt, FaCalendarAlt, FaWallet,
  FaMoon, FaBell, FaTimesCircle, FaCar
} from 'react-icons/fa';
import './usertracking.css';

const UserTracking = () => {
  const navigate = useNavigate();
  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchTrackedUsers = async () => {
      try {
        setIsLoading(true);

        // 1. Get current admin's garageId
        const adminSnap = await getDoc(doc(db, 'admins', currentUser.uid));
        if (!adminSnap.exists()) return;
        const adminData = adminSnap.data();
        const garageId = adminData.garageId;
        if (!garageId) return;

        // 2. Get reservations with matching garageId
        const reservationsSnap = await getDocs(collection(db, 'reservations'));
        const userIdsSet = new Set();

        reservationsSnap.forEach(resDoc => {
          const data = resDoc.data();
          if (data.garageId === garageId && data.userId) {
            userIdsSet.add(data.userId);
          }
        });

        const userIds = Array.from(userIdsSet);
        const usersData = [];

        // 3. Fetch each user's data + vehicles subcollection
        for (const uid of userIds) {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (!userDoc.exists()) continue;

          const userData = userDoc.data();

          const vehiclesSnap = await getDocs(collection(db, 'users', uid, 'vehicles'));
          const vehicles = vehiclesSnap.docs.map(doc => doc.data());

          usersData.push({
            docId: uid,
            metadata: userData.metadata || {},
            payment: userData.payment || {},
            personalInfo: userData.personalInfo || {},
            settings: userData.settings || {},
            vehicles
          });
        }

        setUsersList(usersData);
      } catch (error) {
        console.error('Error fetching tracked users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrackedUsers();
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
          <p className="no-users-text">No users found for this garage.</p>
        ) : (
          <div className="users-grid">
            {usersList.map((user, idx) => {
              const {
                metadata: { createdAt: tsCreatedAt, lastLogin: tsLastLogin, id: metadataId } = {},
                payment: { walletBalance = null, savedCards = [] } = {},
                personalInfo: {
                  name = 'Unnamed User',
                  email = 'No email',
                  phoneNumber = null,
                  profilePicture = null
                } = {},
                settings: {
                  appPrefs: { darkMode = false } = {},
                  notifications: {
                    emailEnabled = false,
                    pushEnabled = false,
                    smsEnabled = false
                  } = {}
                } = {},
                vehicles = []
              } = user;

              const createdAtDate = tsCreatedAt?.seconds
                ? new Date(tsCreatedAt.seconds * 1000)
                : null;
              const lastLoginDate = tsLastLogin?.seconds
                ? new Date(tsLastLogin.seconds * 1000)
                : null;

              return (
                <div
                  key={user.docId}
                  className="user-card animate-card"
                  style={{ animationDelay: `${0.1 * idx}s` }}
                >
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
                    <div className="user-photo">
                      <img
                        src={profilePicture}
                        alt={`${name}'s profile`}
                        className="profile-picture"
                      />
                    </div>
                  )}

                  <hr className="divider" />

                  <p className="user-meta">
                    <strong>UID:</strong> {metadataId || user.docId}
                  </p>
                  {createdAtDate && (
                    <p className="user-meta">
                      <FaCalendarAlt className="icon-small" /> Created:{' '}
                      {createdAtDate.toLocaleDateString()}{' '}
                      {createdAtDate.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                  {lastLoginDate && (
                    <p className="user-meta">
                      <FaCalendarAlt className="icon-small" /> Last Login:{' '}
                      {lastLoginDate.toLocaleDateString()}{' '}
                      {lastLoginDate.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}

                  <hr className="divider" />

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

                  <div className="user-settings">
                    <p className="user-setting">
                      <FaMoon className="icon-small" /> Dark Mode:{' '}
                      {darkMode ? 'Enabled' : 'Disabled'}
                    </p>
                    <p className="user-setting">
                      <FaBell className="icon-small" /> Notifications:
                    </p>
                    <ul className="notification-list">
                      <li>Email: {emailEnabled ? <FaBell className="icon-tick" /> : <FaTimesCircle />}</li>
                      <li>Push: {pushEnabled ? <FaBell className="icon-tick" /> : <FaTimesCircle />}</li>
                      <li>SMS: {smsEnabled ? <FaBell className="icon-tick" /> : <FaTimesCircle />}</li>
                    </ul>
                  </div>

                  <hr className="divider" />

                  <div className="user-vehicles">
                    <h4 className="vehicles-title">
                      <FaCar className="icon-small" /> Vehicles
                    </h4>
                    {vehicles.length === 0 ? (
                      <p className="no-vehicles-text">No vehicles registered.</p>
                    ) : (
                      <ul className="vehicle-list">
                        {vehicles.map((veh, i) => {
                          const { licensePlate, make, model, year } = veh;
                          return (
                            <li key={i} className="vehicle-item">
                              <p><strong>Plate:</strong> {licensePlate || '—'}</p>
                              <p><strong>Make:</strong> {make || '—'} / <strong>Model:</strong> {model || '—'}</p>
                              <p><strong>Year:</strong> {year || '—'}</p>
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
