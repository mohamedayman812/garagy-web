import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import {
  FaUser, FaWarehouse, FaMapMarkerAlt, FaDollarSign,
  FaAlignLeft, FaFileUpload, FaChartBar, FaUsers,
  FaParking, FaSignOutAlt, FaCreditCard
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

      // Update admin name
      await updateDoc(doc(db, "admins", user.uid), {
        name: formData.name
      });

      // Update garage data
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
      <div className="home-container">
        <div className="home-card"><h2>Loading Dashboard...</h2></div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-card">
        <h2 className="home-title">Admin Dashboard</h2>

        {isEditing ? (
          <div className="garage-settings">
            <h3>Update Garage Settings</h3>

            <div className="form-group">
              <div className="input-with-icon">
                <FaUser className="input-icon" />
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Admin Name" />
              </div>
            </div>

            <div className="form-group">
              <div className="input-with-icon">
                <FaWarehouse className="input-icon" />
                <input type="text" name="garageName" value={formData.garageName} onChange={handleInputChange} placeholder="Garage Name" />
              </div>
            </div>

            <div className="form-group">
              <div className="input-with-icon">
                <FaMapMarkerAlt className="input-icon" />
                <input type="text" name="garageLocation" value={formData.garageLocation} onChange={handleInputChange} placeholder="Garage Location" />
              </div>
            </div>

            <div className="form-group">
              <div className="input-with-icon">
                <FaDollarSign className="input-icon" />
                <input type="number" name="hourlyPrice" value={formData.hourlyPrice} onChange={handleInputChange} placeholder="Hourly Price" />
              </div>
            </div>

            <div className="form-group">
              <div className="input-with-icon">
                <FaAlignLeft className="input-icon" />
                <textarea name="description" rows="3" value={formData.description} onChange={handleInputChange} placeholder="Description" />
              </div>
            </div>

            <div className="form-group">
              <label className="file-upload-label">
                <FaFileUpload className="upload-icon" />
                <span>{garagePhoto ? garagePhoto.name : 'Choose Garage Photo'}</span>
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="file-input" />
              </label>
              {photoURL && (
                <div className="photo-preview">
                  <img src={photoURL} alt="Garage Preview" />
                </div>
              )}
            </div>

            <div className="button-group">
              <button onClick={saveGarageSettings} className="action-button primary" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={() => setIsEditing(false)} className="action-button secondary">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="garage-info">
            <h3>Garage Information</h3>
            {photoURL && (
              <div className="garage-photo">
                <img src={photoURL} alt="Garage" />
              </div>
            )}
            <p><FaUser className="info-icon" /> <strong>Admin:</strong> {formData.name}</p>
            <p><FaWarehouse className="info-icon" /> <strong>Garage:</strong> {formData.garageName}</p>
            <p><FaMapMarkerAlt className="info-icon" /> <strong>Location:</strong> {formData.garageLocation}</p>
            <p><FaDollarSign className="info-icon" /> <strong>Hourly Price:</strong> ${formData.hourlyPrice}</p>
            <p><FaAlignLeft className="info-icon" /> <strong>Description:</strong> {formData.description}</p>

            <button onClick={() => setIsEditing(true)} className="action-button primary">
              Update Garage Settings
            </button>
          </div>
        )}

        <div className="services-container">
          <button className="service-button" onClick={() => navigateToService("reports")}>
            <FaChartBar className="service-icon" /><h3>Reports</h3><p>View and reply to user reports</p>
          </button>
          <button className="service-button" onClick={() => navigateToService("user-tracking")}>
            <FaUsers className="service-icon" /><h3>User Tracking</h3><p>Track user activity</p>
          </button>
          <button className="service-button" onClick={() => navigateToService("garage-layout")}>
            <FaParking className="service-icon" /><h3>Garage Layout</h3><p>Manage your space</p>
          </button>
          <button className="service-button" onClick={() => navigateToService("payments")}>
            <FaCreditCard className="service-icon" /><h3>Payments</h3><p>See paid transactions</p>
          </button>
        </div>

        <button onClick={handleLogout} className="logout-button">
          <FaSignOutAlt className="logout-icon" /> Logout
        </button>
      </div>
    </div>
  );
};

export default Home;
