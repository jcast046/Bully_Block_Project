import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import axios from 'axios';
import '../App.css';
import '../IncidentDetail.css';

const IncidentDetail = () => {
    const { id } = useParams();
    const [incident, setIncident] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchIncident = async () => {
            try {
                const response = await axios.get(`http://localhost:3001/api/incidents/${id}`);
                setIncident(response.data);
            } catch (error) {
                console.error("Error fetching incident:", error);
                setError("Failed to load incident data.");
            } finally {
                setLoading(false);
            }
        };

        fetchIncident();
    }, [id]);

    const handleStatusChange = async () => {
        try {
            const updatedStatus = incident.status === 'pending review' ? 'resolved' : 'pending review';
            const response = await axios.put(`http://localhost:3001/api/incidents/${id}`, {
                status: updatedStatus
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setIncident(response.data);
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    return (
        <div className="incident-detail-container">
            {loading ? (
                <p>Loading incident...</p>
            ) : error ? (
                <p className="error">{error}</p>
            ) : (
                <div>
                    <h1>Incident Details</h1>
                    <p><strong>Content ID:</strong> {incident.contentId}</p>
                    <p><strong>User ID:</strong> {incident.userId ? incident.userId : "Unknown"}</p>
                    <p><strong>Severity Level:</strong> {incident.severityLevel.charAt(0).toUpperCase() + incident.severityLevel.slice(1)}</p>
                    <p><strong>Alert Status:</strong> {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}</p>
                    <p><strong>Timestamp:</strong> {new Date(incident.timestamp).toLocaleString()}</p>
                    <p><strong>Content Summary:</strong> {incident.contentSummary || "TBD"}</p>
                    <h1>Full Incident</h1>
                    <p>{incident.fullContent}</p>
                    <button onClick={handleStatusChange}>
                        Mark as {incident.status === 'pending review' ? 'Resolved' : 'Pending Review'}
                    </button>
                    <button onClick={() => navigate('/incidents')}>Back to Incident Reports</button>
                </div>
            )}
        </div>
    );
};

export default IncidentDetail;
