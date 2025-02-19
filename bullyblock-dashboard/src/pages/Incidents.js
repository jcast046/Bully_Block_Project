import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router'; 
import axios from 'axios';
import '../App.css';
import '../Incidents.css';

const Incidents = () => {
    const [incidents, setIncidents] = useState([]); // State to store incidents data
    const [loading, setLoading] = useState(true); // State to handle loading status
    const [error, setError] = useState(null); // State to handle error messages
    const navigate = useNavigate(); // Hook to navigate to different pages

    // Fetch incidents data from the server when the component mounts
    useEffect(() => {
        const fetchIncidents = async () => {
            try {
                const response = await axios.get('http://localhost:3001/api/incidents'); // Fetch data from API
                setIncidents(response.data);
            } catch (error) {
                console.error("Error fetching incidents:", error);
                setError("Failed to load incident data.");
            } finally {
                setLoading(false);
            }
        };

        fetchIncidents();
    }, []); // Empty dependency array means this effect runs once when component mounts

    return (
        <div className="incidents-container">
            <h1>Incident Reports</h1>
            {loading ? (
                <p>Loading incidents...</p> // Display loading message while fetching data
            ) : error ? (
                <p className="error">{error}</p> // Display error message if fetching fails
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
                                <td>{incident.userId ? incident.userId.username : "Unknown"}</td> {/* Display 'Unknown' if userId is not available */}
                                <td>{incident.severityLevel.charAt(0).toUpperCase() + incident.severityLevel.slice(1)}</td>
                                <td>{incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}</td>
                                <td>{incident.contentSummary || "TBD"}</td> {/* Display 'TBD' if contentSummary is not available */}
                                <td>{new Date(incident.timestamp).toLocaleString()}</td> {/* Format timestamp */}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="6">No incidents found.</td> // Display message if no incidents are found
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Incidents;
