import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import '../App.css';
import '../Incidents.css';

const Incidents = () => {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1); // State for current page
    const incidentsPerPage = 100; // Number of incidents per page
    const navigate = useNavigate();

    useEffect(() => {
        const fetchIncidents = async () => {
            try {
                const response = await axios.get('http://localhost:3001/api/incidents');
                setIncidents(response.data);
                console.log(response.data);
            } catch (error) {
                console.error("Error fetching incidents:", error);
                setError("Failed to load incident data.");
            } finally {
                setLoading(false);
            }
        };

        fetchIncidents();
    }, []);

    const handleFilterChange = (e) => {
        setFilter(e.target.value);
        console.log("Selected filter:", e.target.value);
        setCurrentPage(1); // Reset to the first page when the filter changes
    };

    const filteredIncidents = incidents.filter(
        (incident) => filter === 'all' || incident.status === filter
    );

    // Pagination logic
    const indexOfLastIncident = currentPage * incidentsPerPage;
    const indexOfFirstIncident = indexOfLastIncident - incidentsPerPage;
    const currentIncidents = filteredIncidents.slice(
        indexOfFirstIncident,
        indexOfLastIncident
    );

    const totalPages = Math.ceil(filteredIncidents.length / incidentsPerPage);

    const changePage = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className="incidents-container">
            <h1>Incident Reports</h1>
            <div className="filter-menu">
                <select id="filter" value={filter} onChange={handleFilterChange}>
                    <option value="all">All</option>
                    <option value="resolved">Resolved</option>
                    <option value="pending review">Pending review</option>
                </select>
            </div>
            {loading ? (
                <p>Loading incidents...</p>
            ) : error ? (
                <p className="error">{error}</p>
            ) : (
                <>
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
                            {currentIncidents.length > 0 ? (
                                currentIncidents.map((incident) => (
                                    <tr
                                        key={incident._id}
                                        className={incident.status === 'resolved' ? 'resolved' : ''}
                                        onClick={() => navigate(`/incidents/${incident._id}`)}
                                    >
                                        <td>{incident.contentId}</td>
                                        <td>{incident.userId ? incident.userId.username : "Unknown"}</td>
                                        <td>
                                            {incident.severityLevel.charAt(0).toUpperCase() + incident.severityLevel.slice(1)}
                                        </td>
                                        <td>
                                            {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                                        </td>
                                        <td>{incident.contentSummary || "TBD"}</td>
                                        <td>{new Date(incident.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6">No incidents found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <div className="pagination">
                        <button onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1}>
                            Previous
                        </button>
                        <span>
                            Page {currentPage} of {totalPages}
                        </span>
                        <button onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages}>
                            Next
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Incidents;
