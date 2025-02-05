import React from 'react';
import '../App.css';
import DashboardWidget from '../components/specific/DashboardWidget';
import axios from "axios";

const Dashboard = () => {
    // Placeholders for API data fetching
    /*
    axios.get("https://localhost:3001/api/incidents/count")
        .then((response) => setIncidentCount(response.data.count))
        .catch((error) => console.error("Error fetching incidents:", error));

    axios.get("https://localhost:3001/api/analytics/highlights")
        .then((response) => setAnalyticsData(response.data.highlight))
        .catch((error) => console.error("Error fetching analytics:", error));
    */

    return (
        <div className="dashboard-container">
            <h1>Dashboard</h1>
            <p>Dashboard page content goes here.</p>
            <div className="dashboard-widget-container">
                <DashboardWidget
                    title="Incidents" 
                    value="100"
                    description="View Incidents"
                    link="/incidents" 
                    icon="fas fa-exclamation-circle"
                    color="#ad7f2a"
                />
                <DashboardWidget 
                    title="Analytics" 
                    value={/*analyticsData ||*/ "Loading..."} 
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
