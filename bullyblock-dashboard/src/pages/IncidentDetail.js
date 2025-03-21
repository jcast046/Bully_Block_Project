import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import axios from 'axios';
import '../App.css';
import '../IncidentDetail.css';

const IncidentDetail = () => {
    const { id } = useParams(); // Get incident ID from URL parameters
    const [incident, setIncident] = useState(null); // State to store incident data
    const [loading, setLoading] = useState(true); // State to handle loading status
    const [error, setError] = useState(null); // State to handle error messages
    const navigate = useNavigate(); // Hook to navigate to different pages

    // Fetch incident data from the server when the component first renders
    useEffect(() => {
        const fetchIncident = async () => {
            try {
                const response = await axios.get(`http://localhost:3001/api/incidents/${id}`); // Fetch incident data by ID
                const transformedIncident = {
                    ...response.data,
                    userId: response.data.author_id, // Map author_id to userId
                    username: response.data.username || "Unknown" // Add username with fallback
                };
                setIncident(transformedIncident); // Set the transformed incident data
            } catch (error) {
                console.error("Error fetching incident:", error);
                setError("Failed to load incident data.");
            } finally {
                setLoading(false);
            }
        };

        fetchIncident();
    }, [id]); // Dependency array ensures this effect runs when 'id' changes

    // Handle status change of the incident
    const handleStatusChange = async () => {
        try {
            const updatedStatus = incident.status === 'pending review' ? 'resolved' : 'pending review';
            const response = await axios.put(`http://localhost:3001/api/incidents/${id}`, {
                status: updatedStatus
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setIncident({ ...incident, status: response.data.status }); // Update incident's status locally
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    return (
        <div className="incident-detail-container">
            {loading ? (
                <p>Loading incident...</p> // Display loading message while fetching data
            ) : error ? (
                <p className="error">{error}</p> // Display error message if fetching fails
            ) : (
                <div>
                    <h1>Incident Details</h1>
                    <p><strong>Content ID:</strong> {incident.contentId || "Unknown"}</p> {/* Display Content ID */}
                    <p><strong>User ID:</strong> {incident.userId || "Unknown"}</p> {/* Display User ID */}
                    <p><strong>Username:</strong> {incident.username}</p> {/* Display Username */}
                    <p><strong>Severity Level:</strong> {incident.severityLevel
                        ? incident.severityLevel.charAt(0).toUpperCase() + incident.severityLevel.slice(1)
                        : "Unknown"}</p> {/* Display Severity Level */}
                    <p><strong>Alert Status:</strong> {incident.status
                        ? incident.status.charAt(0).toUpperCase() + incident.status.slice(1)
                        : "Unknown"}</p> {/* Display Alert Status */}
                    <p><strong>Timestamp:</strong> {incident.timestamp
                        ? new Date(incident.timestamp).toLocaleString()
                        : "Unknown"}</p> {/* Format and display timestamp */}
                    <p><strong>Content Summary:</strong> {incident.contentSummary || "TBD"}</p> {/* Display Content Summary */}
                    <h1>Full Incident</h1>
                    <p>{incident.fullContent || "Full content not available."}</p> {/* Display full content or fallback */}

                    <button onClick={handleStatusChange}>
                        Mark as {incident.status === 'pending review' ? 'Resolved' : 'Pending Review'}
                    </button>
                    <button onClick={() => navigate('/incidents')}>Back to Incident Reports</button> {/* Button to navigate back to the incidents page */}
                </div>
            )}
        </div>
    );
};

export default IncidentDetail;
