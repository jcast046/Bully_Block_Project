import React from 'react';
import '../App.css';

const Dashboard = ({ setAuth }) => {
    // Handle user logout by removing token from localStorage and updating the auth state
    const handleLogout = () => {
        localStorage.removeItem("token"); // Remove the JWT token from localStorage
        setAuth(false); // Update auth state to false (logged out)
    };

    return (
        <div className="dashboard-container">
            <h1>Dashboard</h1>
            <p>Dashboard page content goes here.</p>

            {/* Logout button for the user */}
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
};

export default Dashboard;
