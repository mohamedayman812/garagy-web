// components/ProtectedRoute.js
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAuth } from 'firebase/auth';

const ProtectedRoute = ({ children }) => {
    const auth = getAuth();
    const location = useLocation();

    if (!auth.currentUser) {
        // Redirect to login but save the location they tried to go to
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;