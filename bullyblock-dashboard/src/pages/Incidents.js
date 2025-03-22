import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import axios from 'axios';
import '../App.css';
import '../Incidents.css';

const Incidents = () => {
    const [incidents, setIncidents] = useState([]); // State to store incidents data
    const [loading, setLoading] = useState(true); // Handle loading status
    const [error, setError] = useState(null); // State for error messages
    const [filter, setFilter] = useState('all'); // Track the current filter
    const location = useLocation(); // Get state from navigation
    const [currentPage, setCurrentPage] = useState(location.state?.currentPage || 1); // Retrieve current page from state or default to 1
    const incidentsPerPage = 50; // Number of incidents per page
    const navigate = useNavigate(); // Hook for navigating to other pages

    // Fetch incidents from the backend API
    useEffect(() => {
        const fetchIncidents = async () => {
            try {
                const response = await axios.get('http://localhost:3001/api/incidents'); // API call
                setIncidents(response.data); // Store the response data
                console.log(response.data); // Log data for debugging
            } catch (error) {
                console.error("Error fetching incidents:", error); // Log errors if fetch fails
                setError("Failed to load incident data."); // Set error message
            } finally {
                setLoading(false); // Set loading to false once done
            }
        };

        fetchIncidents(); // Trigger data fetch on component mount
    }, []);

    // Handle filter changes
    const handleFilterChange = (e) => {
        setFilter(e.target.value); // Update the selected filter
        console.log("Selected filter:", e.target.value); // Log filter for debugging
        setCurrentPage(1); // Reset to the first page when filter changes
    };

    // Filter and sort incidents
    const filteredIncidents = incidents
        .filter((incident) => filter === 'all' || incident.status === filter) // Apply the filter
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Show newest incidents first

    // Pagination logic
    const indexOfLastIncident = currentPage * incidentsPerPage; // Last incident's index for the current page
    const indexOfFirstIncident = indexOfLastIncident - incidentsPerPage; // First incident's index for the current page
    const currentIncidents = filteredIncidents.slice( // Slice incidents for the current page
        indexOfFirstIncident,
        indexOfLastIncident
    );

    const totalPages = Math.ceil(filteredIncidents.length / incidentsPerPage); // Total number of pages

    // Handle pagination navigation
    const changePage = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) { // Check if the new page is valid
            setCurrentPage(newPage); // Update the current page
        }
    };

    return (
        <div className="incidents-container">
            <h1>Incident Reports</h1>
            <div className="filter-menu">
                {/* Dropdown for selecting a filter */}
                <select id="filter" value={filter} onChange={handleFilterChange}>
                    <option value="all">All</option>
                    <option value="resolved">Resolved</option>
                    <option value="pending review">Pending review</option>
                </select>
            </div>
            {loading ? (
                <p>Loading incidents...</p> // Display loading message
            ) : error ? (
                <p className="error">{error}</p> // Display error message
            ) : (
                <>
                    <table className="incidents-table">
                        <thead>
                            <tr>
                                <th>Content ID</th>
                                <th>User ID</th>
                                <th>Username</th>
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
                                        key={incident._id} // Unique key for each row
                                        className={incident.status === 'resolved' ? 'resolved' : ''} // Highlight resolved incidents
                                        onClick={() => navigate(`/incidents/${incident._id}`, { state: { currentPage } })} // Navigate to the detailed view and pass current page
                                    >
                                        <td>{incident.contentId}</td> {/* Content ID */}
                                        <td>{incident.authorId}</td> {/* User ID */}
                                        <td>{incident.username}</td> {/* Username */}
                                        <td>
                                            {incident.severityLevel.charAt(0).toUpperCase() + incident.severityLevel.slice(1)}
                                        </td> {/* Severity Level */}
                                        <td>
                                            {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                                        </td> {/* Alert Status */}
                                        <td>{incident.contentSummary || "TBD"}</td> {/* Content Summary */}
                                        <td>{new Date(incident.timestamp).toLocaleString()}</td> {/* Timestamp */}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6">No incidents found.</td> {/* No matching incidents */}
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <div className="pagination">
                        {/* Previous button */}
                        <button onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1}>
                            Previous
                        </button>
                        {/* Page indicator */}
                        <span>
                            Page {currentPage} of {totalPages}
                        </span>
                        {/* Next button */}
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
