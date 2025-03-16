import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Reuse the same CSS for consistent styling

const Home = () => {
    const navigate = useNavigate();
    const adminData = JSON.parse(localStorage.getItem('adminData')); // Get admin data from localStorage

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn'); // Clear login status
        localStorage.removeItem('adminData'); // Clear admin data
        navigate('/login'); // Redirect to login page
    };

    // Function to navigate to different services
    const navigateToService = (service) => {
        navigate(`/${service}`); // Navigate to the service route
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Admin Dashboard</h2>

                {/* Services Section (as buttons) */}
                <div className="services-container">
                    {/* Profile Button */}
                    <button className="service-button" onClick={() => navigateToService('profile')}>
                        <h3>Profile</h3>
                        <p>View and manage your profile.</p>
                    </button>

                    {/* Reports Button */}
                    <button className="service-button" onClick={() => navigateToService('reports')}>
                        <h3>Reports</h3>
                        <p>View and reply to user reports.</p>
                    </button>

                    {/* User Tracking Button */}
                    <button className="service-button" onClick={() => navigateToService('user-tracking')}>
                        <h3>User Tracking</h3>
                        <p>Track user activity and parking records.</p>
                    </button>
                </div>

                
            </div>
        </div>
    );
};

export default Home;