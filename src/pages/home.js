import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();
    const [adminData, setAdminData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        garageName: '',
        garageLocation: ''
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
                        garageLocation: data.garage?.location || ''
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
            
            // Upload new photo if selected
            if (garagePhoto) {
                const photoRef = ref(storage, `garage_photos/${user.uid}`);
                await uploadBytes(photoRef, garagePhoto);
                newPhotoURL = await getDownloadURL(photoRef);
                setPhotoURL(newPhotoURL);
            }

            // Update admin document
            await updateDoc(doc(db, 'admins', user.uid), {
                name: formData.name,
                garage: {
                    name: formData.garageName,
                    location: formData.garageLocation,
                    photoURL: newPhotoURL
                }
            });

            // Update garage document
            if (adminData.garageId) {
                await updateDoc(doc(db, 'garages', adminData.garageId), {
                    name: formData.garageName,
                    location: formData.garageLocation,
                    photoURL: newPhotoURL
                });
            }

            setIsEditing(false);
            setAdminData(prev => ({
                ...prev,
                name: formData.name,
                garage: {
                    ...prev.garage,
                    name: formData.garageName,
                    location: formData.garageLocation,
                    photoURL: newPhotoURL
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
                            <label>Admin Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Garage Name</label>
                            <input
                                type="text"
                                name="garageName"
                                value={formData.garageName}
                                onChange={handleInputChange}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Garage Location</label>
                            <input
                                type="text"
                                name="garageLocation"
                                value={formData.garageLocation}
                                onChange={handleInputChange}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Garage Photo</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                            />
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
                        <p><strong>Admin:</strong> {adminData?.name}</p>
                        <p><strong>Garage:</strong> {adminData?.garage?.name}</p>
                        <p><strong>Location:</strong> {adminData?.garage?.location}</p>
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
                        <h3>Reports</h3>
                        <p>View and reply to user reports</p>
                    </button>

                    <button className="service-button" onClick={() => navigateToService('user-tracking')}>
                        <h3>User Tracking</h3>
                        <p>Track user activity and parking records</p>
                    </button>

                    <button className="service-button" onClick={() => navigateToService('garage-layout')}>
                        <h3>Garage Layout</h3>
                        <p>View and update the garage layout</p>
                    </button>
                </div>

                <button onClick={handleLogout} className="logout-button">
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Home;