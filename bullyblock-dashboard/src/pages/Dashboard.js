import React, { useState, useEffect, useContext } from 'react';
import '../App.css';
import DashboardWidget from '../components/specific/DashboardWidget';
import axios from "axios";
import { AuthContext } from '../AuthContext';

const Dashboard = () => {
    // State for incident count and analytics data
    const [alertCount, setAlertCount] = useState(null);
    const { user } = useContext(AuthContext); // Access user info from context

    const baseURL = 'http://localhost:3001/api'; // Base URL for API

    // Fetch incident count from API
    useEffect(() => {
        axios.get(`${baseURL}/alert/count`)
            .then((response) => setAlertCount(response.data.count))
            .catch((error) => {
                console.error("Error fetching incidents:", error);
            });
    }, []);

    return (
        <div className="dashboard-container">
            <h1>Welcome, {user?.username}!</h1> {/* Display the username */}
            <p>Dashboard page content goes here.</p>
            <div className="dashboard-widget-container">
                <DashboardWidget
                    title="Incidents"
                    value={alertCount}
                    description="View Incidents"
                    link="/incidents"
                    icon="fas fa-exclamation-circle"
                    color="#ad7f2a"
                />
                <DashboardWidget
                    title="Analytics"
                    value="Loading..."
                    description="View Bullying Trends"
                    link="/analytics"
                    icon="fas fa-chart-line"
                    color="#67a387"
                />
            </div>
        </div>
    );
};

export default Dashboard;
