import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './Login.css';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!formData.email || !formData.password) {
            setError('Please fill in all fields');
            return;
        }

        setIsLoading(true);

        try {
            const auth = getAuth();
            const userCredential = await signInWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );
            const user = userCredential.user;

            // Check admin privileges
            const adminDoc = await getDoc(doc(db, 'admins', user.uid));
            
            if (!adminDoc.exists()) {
                await auth.signOut();
                throw new Error('Admin privileges not found for this account');
            }

            // Verify garage exists
            const garageDoc = await getDoc(doc(db, 'garages', adminDoc.data().garageId));
            if (!garageDoc.exists()) {
                throw new Error('Associated garage not found');
            }

            // Redirect to home or previous location
            const to = location.state?.from?.pathname || '/home';
            navigate(to, { replace: true });

        } catch (err) {
            console.error("Login error:", err);
            setError(
                err.code === 'auth/user-not-found' ? 'Account not found' :
                err.code === 'auth/wrong-password' ? 'Incorrect password' :
                err.message
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Admin Login</h2>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        <label>Email</label>
                    </div>
                    <div className="form-group">
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <label>Password</label>
                    </div>
                    <button 
                        type="submit" 
                        className="login-button" 
                        disabled={isLoading}
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p className="text-center mt-3">
                    Don't have an account? <a href="/signup" className="text-white">Sign up here</a>
                </p>
            </div>
        </div>
    );
};

export default Login;