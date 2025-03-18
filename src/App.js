import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/footer';
import Home from './pages/home';
import Login from './pages/login';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import UserTracking from './pages/UserTracking';
import GarageLayout from './pages/GarageLayout'; // Import GarageLayout
import ProtectedRoute from './components/protectedRoute';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
    return (
        <Router>
            <div className="d-flex flex-column min-vh-100">
                <Navbar />
                <div className="flex-grow-1">
                    <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route
                            path="/home"
                            element={
                                <ProtectedRoute>
                                    <Home />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/reports"
                            element={
                                <ProtectedRoute>
                                    <Reports />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/user-tracking"
                            element={
                                <ProtectedRoute>
                                    <UserTracking />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/garage-layout"
                            element={
                                <ProtectedRoute>
                                    <GarageLayout />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </div>
                <Footer />
            </div>
        </Router>
    );
}

export default App;