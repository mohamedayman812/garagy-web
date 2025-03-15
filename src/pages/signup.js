import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase'; // Import Firebase services
import './login.css'; // Reuse the same CSS for consistent styling

const SignUp = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();

        try {
            const auth = getAuth();
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Store admin data in Firestore
            await setDoc(doc(db, 'admins', user.uid), {
                name: name,
                email: email,
                type: 'admin', // Default admin type
                createdAt: new Date(),
            });

            navigate('/login'); // Redirect to login page after successful sign-up
        } catch (error) {
            setError(error.message); // Display error message
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Admin Sign Up</h2>
                <form onSubmit={handleSignUp}>
                    <div className="form-group">
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        <label htmlFor="name">Name</label>
                    </div>
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
                        Sign Up
                    </button>
                </form>
                <p className="text-center mt-3">
                    Already have an account? <a href="/login" className="text-white">Login here</a>
                </p>
            </div>
        </div>
    );
};

export default SignUp;