import React, { useState, useEffect } from "react";
import axios from "axios";
import "../App.css";
import "../Analytics.css";

const Analytics = () => {
  // State for analytics data
  const [frequentBullies, setFrequentBullies] = useState([]); // Frequent bullies data
  const [schoolsMostBullying, setSchoolsMostBullying] = useState([]); // Schools with most bullying
  const [datesHighestBullying, setDatesHighestBullying] = useState([]); // Dates with highest bullying
  const [currentPage, setCurrentPage] = useState(1); // Current page for pagination
  const bulliesPerPage = 10; // Max bullies per page
  const [loading, setLoading] = useState(true); // Handle loading status
  const [error, setError] = useState(null); // Handle error messages
  const [images, setImages] = useState([]); // Store images for visualizations
  const [selectedImage, setSelectedImage] = useState(null); // For modal image preview

  // Fetch analytics data and process frequent bullies
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/incidents"); // Fetch all incidents
        const incidents = response.data;

        // Aggregate incidents by username or author_id
        const bullyCounts = {};
        incidents.forEach((incident) => {
          const userKey = incident.username || incident.author_id || "Unknown";
          if (!bullyCounts[userKey]) {
            bullyCounts[userKey] = { name: userKey, incidents: 0 };
          }
          bullyCounts[userKey].incidents += 1;
        });

        // Filter users with 10 or more incidents and sort from most to least
        const sortedBullies = Object.values(bullyCounts)
          .filter((bully) => bully.incidents >= 10)
          .sort((a, b) => b.incidents - a.incidents);

        // Fetch data for schools and dates (already implemented APIs)
        const [schoolsRes, datesRes] = await Promise.all([
          axios.get("http://localhost:3001/api/analytics/schools-bullying"),
          axios.get("http://localhost:3001/api/analytics/dates-bullying"),
        ]);

        // Update states with fetched and processed data
        setFrequentBullies(sortedBullies);
        setSchoolsMostBullying(schoolsRes.data);
        setDatesHighestBullying(datesRes.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching analytics:", error); // Log errors
        setError("Failed to load analytics data"); // Set error message
        setLoading(false);
      }
    };

    fetchAnalytics(); // Fetch data on component mount
  }, []);

  // Fetch most recent images for each image type
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3001/images/latest-images"
        ); // API for latest images
        if (response.status === 200) {
          setImages(response.data); // Store fetched images
        } else {
          console.error("Error fetching images"); // Log error if status is not OK
        }
      } catch (error) {
        console.error("Error fetching images:", error); // Log errors
      }
    };

    fetchImages(); // Fetch images on component mount
  }, []);

  // Pagination logic for the Frequent Bullies table
  const indexOfLastBully = currentPage * bulliesPerPage; // Last bully's index on the current page
  const indexOfFirstBully = indexOfLastBully - bulliesPerPage; // First bully's index on the current page
  const currentBullies = frequentBullies.slice(indexOfFirstBully, indexOfLastBully); // Bullies to display on the current page
  const totalPages = Math.ceil(frequentBullies.length / bulliesPerPage); // Total number of pages

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage); // Update the current page
    }
  };

  // Handle image click to display modal
  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setSelectedImage(null); // Close modal
  };

  // Close modal when clicking outside the image
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setSelectedImage(null);
    }
  };

  return (
    <div className="analytics-container">
      <h1>Bullying Analytics</h1>
      {loading ? (
        <p>Loading analytics...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <>
          {/* Frequent Bullies */}
          <h2>Frequent Bullies</h2>
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Number of Incidents</th>
              </tr>
            </thead>
            <tbody>
              {currentBullies.map((bully, index) => (
                <tr key={index}>
                  {/* Display Username or Author ID and Number of Incidents */}
                  <td>{bully.name}</td>
                  <td>{bully.incidents}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination Controls */}
          <div className="pagination-controls">
            <button
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>

          {/* Schools with Most Bullying Incidents */}
          <h2>Schools with Most Bullying</h2>
          <table className="analytics-table">
            <thead>
              <tr>
                <th>School</th>
                <th>Number of Incidents</th>
              </tr>
            </thead>
            <tbody>
              {schoolsMostBullying.map((school, index) => (
                <tr key={index}>
                  <td>{school.school}</td>
                  <td>{school.incidents}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Dates with Highest Bullying Rates */}
          <h2>Dates with Highest Bullying Rates</h2>
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Number of Incidents</th>
              </tr>
            </thead>
            <tbody>
              {datesHighestBullying.map((date, index) => (
                <tr key={index}>
                  <td>{new Date(date.date).toLocaleDateString()}</td>
                  <td>{date.incidents}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Display Images */}
          <h2>Visualizations</h2>
          {images.length > 0 ? (
            <div className="image-gallery">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="image-container"
                  onClick={() => handleImageClick(image)}
                >
                  <h3>
                    {image.imageType
                      .split("_")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")}
                  </h3>
                  <img
                    src={image.img}
                    alt={`${image.imageType} visualization`}
                  />
                  <p>Updated: {new Date(image.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>Loading images...</p>
          )}

          {/* Image Preview Modal */}
          {selectedImage && (
            <div className="modal-overlay" onClick={handleOverlayClick}>
              <div className="modal-content">
                <button className="modal-close" onClick={handleCloseModal}>
                  ×
                </button>
                <img
                  src={selectedImage.img}
                  alt={`${selectedImage.imageType} visualization`}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Analytics;
