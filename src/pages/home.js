import React from 'react';

const Home = () => {
    return (
        <div>
            {/* Hero Section */}
            <div className="bg-primary text-white text-center py-5">
                <h1 className="display-4">Welcome to Parking Management System</h1>
                <p className="lead">Efficiently manage parking spaces and detect license plates with ease.</p>
                <a href="/admin" className="btn btn-light btn-lg">Go to Admin Panel</a>
            </div>

            {/* Features Section */}
            <div className="container my-5">
                <div className="row">
                    <div className="col-md-4 text-center">
                        <h2>Easy Management</h2>
                        <p>Manage parking slots and vehicles effortlessly.</p>
                    </div>
                    <div className="col-md-4 text-center">
                        <h2>License Plate Detection</h2>
                        <p>Automatically detect license plates using AI.</p>
                    </div>
                    <div className="col-md-4 text-center">
                        <h2>Real-Time Updates</h2>
                        <p>Get real-time updates on parking status.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;