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
    description: ''
  });
  const [garagePhoto, setGaragePhoto] = useState(null);
  const [photoURL, setPhotoURL] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (adminDoc.exists()) {
          const data = adminDoc.data();
          setAdminData(data);
          setFormData({
            name: data.name || '',
            garageName: data.garage?.name || '',
            garageLocation: data.garage?.location || '',
            hourlyPrice: data.garage?.hourlyPrice || '',
            description: data.garage?.description || ''
          });
          setPhotoURL(data.garage?.photoURL || '');
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, [navigate]);

  const handleLogout = () => {
    const auth = getAuth();
    auth.signOut();
    navigate('/login');
  };

  const handlePhotoChange = (e) => {
    if (e.target.files[0]) {
      setGaragePhoto(e.target.files[0]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveGarageSettings = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user || !adminData) return;

    setIsLoading(true);
    try {
      let newPhotoURL = photoURL;
      
      if (garagePhoto) {
        const photoRef = ref(storage, `garage_photos/${user.uid}`);
        await uploadBytes(photoRef, garagePhoto);
        newPhotoURL = await getDownloadURL(photoRef);
        setPhotoURL(newPhotoURL);
      }

      const garageData = {
        name: formData.garageName,
        location: formData.garageLocation,
        photoURL: newPhotoURL,
        hourlyPrice: formData.hourlyPrice,
        description: formData.description
      };

      await updateDoc(doc(db, 'admins', user.uid), {
        name: formData.name,
        garage: garageData
      });

      if (adminData.garageId) {
        await updateDoc(doc(db, 'garages', adminData.garageId), garageData);
      }

      setIsEditing(false);
      setAdminData(prev => ({
        ...prev,
        name: formData.name,
        garage: {
          ...prev.garage,
          ...garageData
        }
      }));
    } catch (error) {
      console.error('Error updating garage settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToService = (service) => {
    navigate(`/${service}`);
  };

  if (isLoading) {
    return (
      <div className="home-container">
        <div className="home-card">
          <h2>Loading Dashboard...</h2>
        </div>
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
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Admin Name"
                />
              </div>
            </div>
            
            <div className="form-group">
              <div className="input-with-icon">
                <FaWarehouse className="input-icon" />
                <input
                  type="text"
                  name="garageName"
                  value={formData.garageName}
                  onChange={handleInputChange}
                  placeholder="Garage Name"
                />
              </div>
            </div>
            
            <div className="form-group">
              <div className="input-with-icon">
                <FaMapMarkerAlt className="input-icon" />
                <input
                  type="text"
                  name="garageLocation"
                  value={formData.garageLocation}
                  onChange={handleInputChange}
                  placeholder="Garage Location"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-with-icon">
                <FaDollarSign className="input-icon" />
                <input
                  type="number"
                  name="hourlyPrice"
                  value={formData.hourlyPrice}
                  onChange={handleInputChange}
                  placeholder="Hourly Price ($)"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-with-icon">
                <FaAlignLeft className="input-icon" />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Description"
                  rows="3"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="file-upload-label">
                <FaFileUpload className="upload-icon" />
                <span>{garagePhoto ? garagePhoto.name : 'Choose Garage Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="file-input"
                />
              </label>
              {photoURL && (
                <div className="photo-preview">
                  <img src={photoURL} alt="Garage Preview" />
                </div>
              )}
            </div>
            
            <div className="button-group">
              <button 
                onClick={saveGarageSettings}
                className="action-button primary"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="action-button secondary"
              >
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
            <p><FaUser className="info-icon" /> <strong>Admin:</strong> {adminData?.name}</p>
            <p><FaWarehouse className="info-icon" /> <strong>Garage:</strong> {adminData?.garage?.name}</p>
            <p><FaMapMarkerAlt className="info-icon" /> <strong>Location:</strong> {adminData?.garage?.location}</p>
            <p><FaDollarSign className="info-icon" /> <strong>Hourly Price:</strong> ${adminData?.garage?.hourlyPrice || 'Not set'}</p>
            <p><FaAlignLeft className="info-icon" /> <strong>Description:</strong> {adminData?.garage?.description || 'No description provided'}</p>
            <button 
              onClick={() => setIsEditing(true)}
              className="action-button primary"
            >
              Update Garage Settings
            </button>
          </div>
        )}

        <div className="services-container">
          <button className="service-button" onClick={() => navigateToService('reports')}>
            <FaChartBar className="service-icon" />
            <h3>Reports</h3>
            <p>View and reply to user reports</p>
          </button>

          <button className="service-button" onClick={() => navigateToService('user-tracking')}>
            <FaUsers className="service-icon" />
            <h3>User Tracking</h3>
            <p>Track user activity and parking records</p>
          </button>

          <button className="service-button" onClick={() => navigateToService('garage-layout')}>
            <FaParking className="service-icon" />
            <h3>Garage Layout</h3>
            <p>View and update the garage layout</p>
          </button>

          <button className="service-button" onClick={() => navigateToService('payments')}>
            <FaCreditCard className="service-icon" />
            <h3>Payments</h3>
            <p>Manage payment methods and transactions</p>
          </button>
        </div>

        <button onClick={handleLogout} className="logout-button">
          <FaSignOutAlt className="logout-icon" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Home;