import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import axios from "axios";
import { IncidentsContext } from "../IncidentsContext";
import "../App.css";
import "../IncidentDetail.css";

const IncidentDetail = () => {
  const { id } = useParams(); // Get incident ID from URL parameters
  const location = useLocation(); // Access location to retrieve passed state
  const [incident, setIncident] = useState(null); // State to store incident data
  const [loading, setLoading] = useState(true); // State to handle loading status
  const [error, setError] = useState(null); // State to handle error messages
  const navigate = useNavigate(); // Hook to navigate to different pages
  const { fetchIncidents } = useContext(IncidentsContext); // Access fetchIncidents

  // Retrieve current page from location state or default to page 1
  const currentPage = location.state?.currentPage || 1;

  // Fetch incident data from the server when the component first renders
  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3001/api/incidents/${id}`
        ); // Fetch incident by ID
        const transformedIncident = {
          ...response.data,
          userId: response.data.author_id, // Map author_id to userId
          username: response.data.username || "Unknown", // Add username with fallback
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
      const token = localStorage.getItem("token");
      console.log("Token value:", token); // Debug log to see the actual token value

      if (!token || token === "") {
        console.error("No valid token found in localStorage");
        return;
      }

      const updatedStatus =
        incident.status === "pending review" ? "resolved" : "pending review";
      const response = await axios.put(
        `http://localhost:3001/api/incidents/${id}`,
        {
          status: updatedStatus,
        },
        {
          headers: { Authorization: `Bearer ${token}` }, // Use the same token variable
        }
      );
      setIncident({ ...incident, status: response.data.status });
      await fetchIncidents(); // Refresh global incidents list
    } catch (error) {
      console.error(
        "Error updating status:",
        error.response?.data || error.message
      );
      if (error.response?.status === 401) {
        console.error(
          "Authentication failed. Token might be expired or invalid."
        );
      }
    }
  };

  // Function to extract plain text from HTML string
  const extractText = (htmlString) => {
    const parser = new DOMParser();
    const parsedDocument = parser.parseFromString(htmlString, "text/html");
    return parsedDocument.body.textContent || "Full content not available."; // Return plain text or fallback
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
          <p>
            <strong>Content ID:</strong> {incident.contentId || "Unknown"}
          </p>{" "}
          {/* Display Content ID */}
          <p>
            <strong>User ID:</strong> {incident.authorId || "Unknown"}
          </p>{" "}
          {/* Display User ID */}
          <p>
            <strong>Username:</strong> {incident.username}
          </p>{" "}
          {/* Display Username */}
          <p>
            <strong>Severity Level:</strong>{" "}
            {incident.severityLevel
              ? incident.severityLevel.charAt(0).toUpperCase() +
              incident.severityLevel.slice(1)
              : "Unknown"}
          </p>{" "}
          {/* Display Severity Level */}
          <p>
            <strong>Alert Status:</strong>{" "}
            {incident.status
              ? incident.status.charAt(0).toUpperCase() +
              incident.status.slice(1)
              : "Unknown"}
          </p>{" "}
          {/* Display Alert Status */}
          <p>
            <strong>Timestamp:</strong>{" "}
            {incident.timestamp
              ? new Date(incident.timestamp).toLocaleString()
              : "Unknown"}
          </p>{" "}
          {/* Format and display timestamp */}
          <h1>Full Incident</h1>
          <p>{extractText(incident.content)}</p>{" "}
          {/* Clean and display full content */}
          <button onClick={handleStatusChange}>
            Mark as{" "}
            {incident.status === "pending review"
              ? "Resolved"
              : "Pending Review"}
          </button>
          {/* Pass current page back to Incidents */}
          <button
            onClick={() => navigate("/incidents", { state: { currentPage } })}
          >
            Back to Incident Reports
          </button>
        </div>
      )}
    </div>
  );
};

export default IncidentDetail;