import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const isLoggedIn = localStorage.getItem('isLoggedIn'); // Check if admin is logged in

    if (!isLoggedIn) {
        return <Navigate to="/" />; // Redirect to login if not logged in
    }

    return children; // Render the protected component
};

export default ProtectedRoute;