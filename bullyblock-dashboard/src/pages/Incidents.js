import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import '../App.css';
import '../Incidents.css';

const Incidents = () => {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchIncidents = async () => {
            try {
                const response = await axios.get('http://localhost:3001/api/incidents');
                setIncidents(response.data);
            } catch (error) {
                console.error("Error fetching incidents:", error);
                setError("Failed to load incident data.");
            } finally {
                setLoading(false);
            }
        };

        fetchIncidents();
    }, []);

    return (
        <div className="incidents-container">
            <h1>Incident Reports</h1>
            {loading ? (
                <p>Loading incidents...</p>
            ) : error ? (
                <p className="error">{error}</p>
            ) : (
                <table className="incidents-table">
                    <thead>
                        <tr>
                            <th>Content ID</th>
                            <th>User ID</th>
                            <th>Severity Level</th>
                            <th>Alert Status</th>
                            <th>Content Summary</th>
                            <th>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {incidents.length > 0 ? incidents.map(incident => (
                            <tr key={incident._id} className={incident.status === 'resolved' ? 'resolved' : ''} onClick={() => navigate(`/incidents/${incident._id}`)}>
                                <td>{incident.contentId}</td>
                                <td>{incident.userId ? incident.userId.username : "Unknown"}</td>
                                <td>{incident.severityLevel.charAt(0).toUpperCase() + incident.severityLevel.slice(1)}</td>
                                <td>{incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}</td>
                                <td>{incident.contentSummary || "TBD"}</td>
                                <td>{new Date(incident.timestamp).toLocaleString()}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="6">No incidents found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Incidents;
