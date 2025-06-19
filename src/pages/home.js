import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import {
  FaUser, FaWarehouse, FaMapMarkerAlt, FaDollarSign,
  FaAlignLeft, FaFileUpload, FaChartBar, FaUsers,
  FaParking, FaSignOutAlt, FaCreditCard, FaComments
} from 'react-icons/fa';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    garageName: '',
    garageLocation: '',
    hourlyPrice: '',
    description: '',
  });
  const [garagePhoto, setGaragePhoto] = useState(null);
  const [photoURL, setPhotoURL] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        const adminRef = doc(db, "admins", user.uid);
        const adminSnap = await getDoc(adminRef);
        if (adminSnap.exists()) {
          const admin = adminSnap.data();
          setAdminData(admin);

          const garageId = admin.garageId;
          const garageRef = doc(db, "garages", garageId);
          const garageSnap = await getDoc(garageRef);

          if (garageSnap.exists()) {
            const garage = garageSnap.data();
            const info = garage.Information || {};
            const location = garage.Location || {};

            setFormData({
              name: admin.name || '',
              garageName: info.name || '',
              garageLocation: location.Address || '',
              hourlyPrice: info.hourlyrate || '',
              description: info.description || ''
            });

            setPhotoURL(info.pictures?.picUrl1 || '');
          }
        }
      } catch (err) {
        console.error("Failed to fetch dashboard info:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    const auth = getAuth();
    auth.signOut();
    navigate('/login');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    if (e.target.files[0]) {
      setGaragePhoto(e.target.files[0]);
    }
  };

  const saveGarageSettings = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !adminData) return;

    setIsLoading(true);
    try {
      let uploadedPhotoUrl = photoURL;

      if (garagePhoto) {
        const photoRef = ref(storage, `garage_photos/${user.uid}/main.jpg`);
        await uploadBytes(photoRef, garagePhoto);
        uploadedPhotoUrl = await getDownloadURL(photoRef);
      }

      await updateDoc(doc(db, "admins", user.uid), {
        name: formData.name
      });

      const garageRef = doc(db, "garages", adminData.garageId);
      await updateDoc(garageRef, {
        Information: {
          name: formData.garageName,
          description: formData.description,
          hourlyrate: Number(formData.hourlyPrice),
          pictures: { picUrl1: uploadedPhotoUrl }
        },
        Location: {
          Address: formData.garageLocation
        }
      });

      setPhotoURL(uploadedPhotoUrl);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update garage:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToService = (route) => navigate(`/${route}`);

  if (isLoading) {
    return (
      <div className="dashboard-wrapper">
        <div className="creative-container">
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="loading-spinner" style={{ marginBottom: '1rem' }}></div>
            <h2 style={{ color: '#fff', margin: 0 }}>Loading Dashboard...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className="creative-container">
        <h1 className="creative-title animate-fade-in-up">Admin Dashboard</h1>

        {isEditing ? (
          <div className="glass-card animate-fade-in-up animate-delay-1" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
            <h2 style={{ color: '#fff', marginBottom: '2rem', fontSize: '1.75rem', textAlign: 'center' }}>
              Update Garage Settings
            </h2>

            <div className="modern-input-group">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Admin Name"
                className="modern-input"
              />
              <div className="floating-label">
                <FaUser style={{ marginRight: '0.5rem' }} />
                Admin Name
              </div>
            </div>

            <div className="modern-input-group">
              <input
                type="text"
                name="garageName"
                value={formData.garageName}
                onChange={handleInputChange}
                placeholder="Garage Name"
                className="modern-input"
              />
              <div className="floating-label">
                <FaWarehouse style={{ marginRight: '0.5rem' }} />
                Garage Name
              </div>
            </div>

            <div className="modern-input-group">
              <input
                type="text"
                name="garageLocation"
                value={formData.garageLocation}
                onChange={handleInputChange}
                placeholder="Garage Location"
                className="modern-input"
              />
              <div className="floating-label">
                <FaMapMarkerAlt style={{ marginRight: '0.5rem' }} />
                Location
              </div>
            </div>

            <div className="modern-input-group">
              <input
                type="number"
                name="hourlyPrice"
                value={formData.hourlyPrice}
                onChange={handleInputChange}
                placeholder="Hourly Price"
                className="modern-input"
              />
              <div className="floating-label">
                <FaDollarSign style={{ marginRight: '0.5rem' }} />
                Hourly Price
              </div>
            </div>

            <div className="modern-input-group">
              <textarea
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Description"
                className="modern-input"
                style={{ resize: 'vertical', minHeight: '120px' }}
              />
              <div className="floating-label">
                <FaAlignLeft style={{ marginRight: '0.5rem' }} />
                Description
              </div>
            </div>

            <div className="modern-input-group">
              <label className="creative-btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                <FaFileUpload style={{ marginRight: '0.5rem' }} />
                {garagePhoto ? garagePhoto.name : 'Choose Garage Photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
              </label>
              {photoURL && (
                <div className="photo-preview">
                  <img src={photoURL || "/placeholder.svg"} alt="Garage Preview" />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
              <button
                onClick={saveGarageSettings}
                className="creative-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner" style={{ marginRight: '0.5rem' }}></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="creative-btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-card animate-fade-in-up animate-delay-1" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
            <h2 style={{ color: '#fff', marginBottom: '2rem', fontSize: '1.75rem', textAlign: 'center' }}>
              Garage Information
            </h2>
            
            {photoURL && (
              <div className="photo-preview" style={{ marginBottom: '2rem' }}>
                <img src={photoURL || "/placeholder.svg"} alt="Garage" />
              </div>
            )}

            <div className="info-grid">
              <div className="info-card">
                <div className="info-label">
                  <FaUser style={{ marginRight: '0.5rem' }} />
                  Admin
                </div>
                <div className="info-value">{formData.name}</div>
              </div>
              <div className="info-card">
                <div className="info-label">
                  <FaWarehouse style={{ marginRight: '0.5rem' }} />
                  Garage
                </div>
                <div className="info-value">{formData.garageName}</div>
              </div>
              <div className="info-card">
                <div className="info-label">
                  <FaMapMarkerAlt style={{ marginRight: '0.5rem' }} />
                  Location
                </div>
                <div className="info-value">{formData.garageLocation}</div>
              </div>
              <div className="info-card">
                <div className="info-label">
                  <FaDollarSign style={{ marginRight: '0.5rem' }} />
                  Hourly Price
                </div>
                <div className="info-value">${formData.hourlyPrice}</div>
              </div>
            </div>

            <div className="info-card" style={{ marginBottom: '2rem' }}>
              <div className="info-label">
                <FaAlignLeft style={{ marginRight: '0.5rem' }} />
                Description
              </div>
              <div className="info-value" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                {formData.description}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button onClick={() => setIsEditing(true)} className="creative-btn">
                Update Garage Settings
              </button>
            </div>
          </div>
        )}

        <div className="services-grid">
          <div className="service-card animate-fade-in-up animate-delay-2" onClick={() => navigateToService("reports")}>
            <FaChartBar className="service-icon" />
            <h3 className="service-title">Reports</h3>
            <p className="service-description">View and reply to user reports</p>
          </div>
          
          <div className="service-card animate-fade-in-up animate-delay-3" onClick={() => navigateToService("user-tracking")}>
            <FaUsers className="service-icon" />
            <h3 className="service-title">User Tracking</h3>
            <p className="service-description">Track user activity and analytics</p>
          </div>
          
          <div className="service-card animate-fade-in-up animate-delay-4" onClick={() => navigateToService("garage-layout")}>
            <FaParking className="service-icon" />
            <h3 className="service-title">Garage Layout</h3>
            <p className="service-description">Manage your parking space layout</p>
          </div>
          
          <div className="service-card animate-fade-in-up animate-delay-1" onClick={() => navigateToService("payments")}>
            <FaCreditCard className="service-icon" />
            <h3 className="service-title">Payments</h3>
            <p className="service-description">View paid transactions and revenue</p>
          </div>
          
          <div className="service-card animate-fade-in-up animate-delay-2" onClick={() => navigateToService("reviews")}>
            <FaComments className="service-icon" />
            <h3 className="service-title">Reviews</h3>
            <p className="service-description">Read customer feedback and reviews</p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <button onClick={handleLogout} className="creative-btn" style={{ 
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
            boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)'
          }}>
            <FaSignOutAlt style={{ marginRight: '0.5rem' }} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
