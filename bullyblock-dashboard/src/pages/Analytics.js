import React, { useState, useEffect } from "react";
import axios from "axios";
import "../App.css";
import "../Analytics.css";

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [bulliesRes, schoolsRes, datesRes] = await Promise.all([
          axios.get("http://localhost:3001/api/analytics/frequent-bullies"),
          axios.get("http://localhost:3001/api/analytics/schools-bullying"),
          axios.get("http://localhost:3001/api/analytics/dates-bullying"),
        ]);

        setAnalyticsData({
          frequentBullies: bulliesRes.data,
          schoolsMostBullying: schoolsRes.data,
          datesHighestBullying: datesRes.data,
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching analytics:", error);
        setError("Failed to load analytics data");
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Fetch most recent images for each image type
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3001/images/latest-images"
        );
        if (response.status === 200) {
          setImages(response.data);
        } else {
          console.error("Error fetching images");
        }
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    };

    fetchImages();
  }, []);

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
                <th>Name</th>
                <th>Number of Incidents</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.frequentBullies.map((bully, index) => (
                <tr
                  key={index}
                  className={bully.incidents === 0 ? "no-data" : ""}
                >
                  <td>{bully.name}</td>
                  <td>{bully.incidents}</td>
                </tr>
              ))}
            </tbody>
          </table>

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
              {analyticsData.schoolsMostBullying.map((school, index) => (
                <tr
                  key={index}
                  className={school.incidents === 0 ? "no-data" : ""}
                >
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
              {analyticsData.datesHighestBullying.map((date, index) => (
                <tr
                  key={index}
                  className={date.incidents === 0 ? "no-data" : ""}
                >
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
                <div key={index} className="image-container">
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
        </>
      )}
    </div>
  );
};

export default Analytics;
