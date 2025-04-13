import React, { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router";
import { IncidentsContext } from "../IncidentsContext";
import "../App.css";
import "../Incidents.css";

/**
 * Component to display the list of incidents with filtering and pagination.
 */
const Incidents = () => {
  // Access incidents data and utility functions from context
  const { incidents, loading, error, lastFetched } = useContext(IncidentsContext);

  // State to track the selected filter
  const [filter, setFilter] = useState("all");

  // Access the current location (to retrieve state passed during navigation)
  const location = useLocation();

  // State to track the current page (default is 1 or passed state)
  const [currentPage, setCurrentPage] = useState(location.state?.currentPage || 1);

  // Number of incidents to display per page
  const incidentsPerPage = 50;

  // Hook for navigating to other pages
  const navigate = useNavigate();

  /**
   * Handle changes to the filter dropdown.
   * @param {Event} e - The change event triggered by selecting a filter.
   */
  const handleFilterChange = (e) => {
    setFilter(e.target.value); // Update the selected filter
    console.log("Selected filter:", e.target.value); // Log for debugging purposes
    setCurrentPage(1); // Reset to the first page when the filter changes
  };

  /**
   * Filter and sort incidents based on the selected filter.
   */
  const filteredIncidents = incidents
    .filter((incident) => filter === "all" || incident.status === filter) // Apply the filter
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by newest first

  // Calculate indices for slicing the incidents into pages
  const indexOfLastIncident = currentPage * incidentsPerPage;
  const indexOfFirstIncident = indexOfLastIncident - incidentsPerPage;

  // Get the incidents for the current page
  const currentIncidents = filteredIncidents.slice(indexOfFirstIncident, indexOfLastIncident);

  // Calculate the total number of pages
  const totalPages = Math.ceil(filteredIncidents.length / incidentsPerPage);

  /**
   * Handle page navigation.
   * @param {number} newPage - The page number to navigate to.
   */
  const changePage = (newPage) => {
    // Ensure the new page is within valid bounds
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="incidents-container">
      <h1>Incident Reports</h1>
      {lastFetched && <p>Last updated: {lastFetched.toLocaleString()}</p>} {/* Display last fetch time */}
      <div className="filter-menu">
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
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {currentIncidents.length > 0 ? (
                currentIncidents.map((incident) => (
                  <tr
                    key={incident._id}
                    className={incident.status === "resolved" ? "resolved" : ""}
                    onClick={() => navigate(`/incidents/${incident._id}`, { state: { currentPage } })}
                  >
                    <td>{incident.contentId}</td>
                    <td>{incident.authorId}</td>
                    <td>{incident.username}</td>
                    <td>
                      {incident.severityLevel.charAt(0).toUpperCase() +
                        incident.severityLevel.slice(1)}
                    </td>
                    <td>
                      {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                    </td>
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
          <div className="pagination-controls">
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