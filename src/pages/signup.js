import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import './Login.css';

const SignUp = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        garageName: '',
        garageLocation: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');
        
        // Validation
        if (!formData.name || !formData.email || !formData.password || 
            !formData.garageName || !formData.garageLocation) {
            setError('Please fill in all fields');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password should be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            const auth = getAuth();
            
            // 1. Create user account
            console.log("Creating user account...");
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                formData.email, 
                formData.password
            );
            const user = userCredential.user;
            console.log("User created:", user.uid);

            // 2. Create garage document
            console.log("Creating garage document...");
            const garageRef = doc(collection(db, 'garages'));
            await setDoc(garageRef, {
                name: formData.garageName,
                location: formData.garageLocation,
                createdAt: new Date(),
                layout: {}
            });
            console.log("Garage created:", garageRef.id);

            // 3. Create admin document in garage subcollection
            console.log("Creating admin subdocument...");
            await setDoc(doc(db, 'garages', garageRef.id, 'admins', user.uid), {
                uid: user.uid,
                name: formData.name,
                email: formData.email,
                role: 'owner',
                createdAt: new Date()
            });

            // 4. Create main admin document
            console.log("Creating main admin document...");
            await setDoc(doc(db, 'admins', user.uid), {
                uid: user.uid,
                name: formData.name,
                email: formData.email,
                garageId: garageRef.id,
                role: 'owner',
                createdAt: new Date()
            });

            console.log("Signup successful!");
            navigate('/login');
        } catch (err) {
            console.error("Signup error details:", {
                code: err.code,
                message: err.message,
                stack: err.stack
            });
            
            let errorMessage = 'Failed to create account. Please try again.';
            if (err.code === 'auth/email-already-in-use') {
                errorMessage = 'Email already in use';
            } else if (err.code === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters';
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            }
            
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Admin Sign Up</h2>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleSignUp}>
                    {['name', 'email', 'password', 'garageName', 'garageLocation'].map((field) => (
                        <div className="form-group" key={field}>
                            <input
                                type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                                id={field}
                                name={field}
                                value={formData[field]}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor={field}>
                                {field === 'garageName' ? 'Garage Name' : 
                                 field === 'garageLocation' ? 'Garage Location' : 
                                 field.charAt(0).toUpperCase() + field.slice(1)}
                            </label>
                        </div>
                    ))}
                    <button type="submit" className="login-button" disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
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