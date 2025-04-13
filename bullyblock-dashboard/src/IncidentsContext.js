import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create a context for managing incidents data
export const IncidentsContext = createContext();

export const IncidentsProvider = ({ children }) => {
    // State to store the list of incidents
    const [incidents, setIncidents] = useState([]);

    // State to manage loading status
    const [loading, setLoading] = useState(true);

    // State to capture error messages, if any
    const [error, setError] = useState(null);

    // State to track the timestamp of the last successful data fetch
    const [lastFetched, setLastFetched] = useState(null);

    // Base URL for the API (centralized for maintainability)
    const API_BASE_URL = "http://localhost:3001";

    /**
     * Fetch incidents from the API.
     * @param {boolean} showLoading - Whether to display the loading state during the fetch.
     */
    const fetchIncidents = async (showLoading = true) => {
        if (showLoading) setLoading(true); // Set loading state if required
        try {
            // Make a GET request to fetch incidents data
            const response = await axios.get(`${API_BASE_URL}/api/incidents`);
            setIncidents(response.data); // Update incidents state with the fetched data
            setLastFetched(new Date()); // Record the timestamp of this fetch
        } catch (err) {
            // Handle errors during the API call
            console.error("Error fetching incidents:", err);
            setError("Failed to load incident data."); // Update error state
        } finally {
            // Ensure loading is turned off after fetch
            if (showLoading) setLoading(false);
        }
    };

    // Run on component mount: Fetch incidents and set up polling
    useEffect(() => {
        fetchIncidents(); // Initial fetch of data
        const interval = setInterval(fetchIncidents, 120000); // Poll API every 2 minutes
        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, []);

    // Provide incidents data and utility functions to children components
    return (
        <IncidentsContext.Provider value={{ incidents, loading, error, lastFetched, fetchIncidents }}>
            {children}
        </IncidentsContext.Provider>
    );
};