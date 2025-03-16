import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase'; // Import Firebase services
import './Login.css'; // Import CSS for styling

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            // Sign in with email and password
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Fetch admin data from Firestore
            const adminDoc = await getDoc(doc(db, 'admins', user.uid));
            if (adminDoc.exists()) {
                // Store login status and admin data in localStorage
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('adminData', JSON.stringify(adminDoc.data()));

                // Redirect to the home page (or dashboard)
                navigate('/home');
            } else {
                setError('Admin data not found.');
            }
        } catch (error) {
            // Handle errors (e.g., invalid email/password)
            setError(error.message);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Admin Login</h2>
                <form onSubmit={handleLogin}>
                    {/* Email Input */}
                    <div className="form-group">
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <label htmlFor="email">Email</label>
                    </div>

                    {/* Password Input */}
                    <div className="form-group">
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <label htmlFor="password">Password</label>
                    </div>

                    {/* Error Message */}
                    {error && <div className="alert alert-danger">{error}</div>}

                    {/* Login Button */}
                    <button type="submit" className="login-button">
                        Login
                    </button>
                </form>

                {/* Sign Up Link */}
                <p className="text-center mt-3">
                    Don't have an account? <a href="/signup" className="text-white">Sign up here</a>
                </p>
            </div>
        </div>
    );
};

export default Login;