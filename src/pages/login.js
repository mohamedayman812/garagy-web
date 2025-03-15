import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase'; // Import Firebase services
import './login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => { 
        e.preventDefault();

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Fetch admin data from Firestore
            const adminDoc = await getDoc(doc(db, 'admins', user.uid));
            if (adminDoc.exists()) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('adminData', JSON.stringify(adminDoc.data())); // Store admin data
                navigate('/home'); // Redirect to home page after successful login
            } else {
                setError('Admin data not found.');
            }
        } catch (error) {
            setError(error.message); // Display error message
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Admin Login</h2>
                <form onSubmit={handleLogin}>
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
                    {error && <div className="alert alert-danger">{error}</div>}
                    <button type="submit" className="login-button">
                        Login
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