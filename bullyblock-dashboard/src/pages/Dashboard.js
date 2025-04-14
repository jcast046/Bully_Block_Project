import React, { useState, useEffect, useContext } from "react";
import "../App.css";
import DashboardWidget from "../components/specific/DashboardWidget";
import axios from "axios";
import { AuthContext } from "../AuthContext";

const Dashboard = () => {
  // State for incident count and analytics data
  const [incidentCount, setIncidentCount] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [currentStatIndex, setCurrentStatIndex] = useState(0);
  const { user } = useContext(AuthContext);

  const baseURL = "http://localhost:3001/api";

  // Fetch incident count from API
  useEffect(() => {
    axios
      .get(`${baseURL}/incidents/count`)
      .then((response) => setIncidentCount(response.data.count))
      .catch((error) => {
        console.error("Error fetching incidents:", error);
      });
  }, []);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [incidentsRes, datesRes] = await Promise.all([
          axios.get(`${baseURL}/incidents`),
          axios.get(`${baseURL}/analytics/dates-bullying`),
        ]);

        // Calculate severity counts from incidents
        const severityCounts = { high: 0, medium: 0, low: 0 };
        incidentsRes.data.forEach((incident) => {
          const severity = incident.severityLevel.toLowerCase();
          if (severityCounts[severity] !== undefined) {
            severityCounts[severity] += 1;
          }
        });

        // Aggregate incidents by username or author_id
        const bullyCounts = {};
        incidentsRes.data.forEach((incident) => {
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

        setAnalyticsData({
          frequentBullies: sortedBullies[0] || {
            name: "No incidents reported",
            incidents: 0,
          },
          severityCounts,
          datesHighestBullying: datesRes.data[0],
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    };

    fetchAnalytics();
  }, []);

  // Get current analytics stat
  const getStats = () => {
    if (!analyticsData)
      return [{ value: "Loading...", description: "View Bullying Trends" }];

    return [
      {
        value: analyticsData.frequentBullies.incidents,
        description: `Most Incidents: ${analyticsData.frequentBullies.name}`,
      },
      {
        value: analyticsData.severityCounts.high,
        description: "High Severity Incidents",
      },
      {
        value: analyticsData.severityCounts.low,
        description: "Low Severity Incidents",
      },
      {
        value: `Max ${analyticsData.datesHighestBullying.incidents} Incidents`,
        description: `Peak Date: ${new Date(
          analyticsData.datesHighestBullying.date
        ).toLocaleDateString()}`,
      },
    ];
  };

  const stats = getStats();
  const currentStat = stats[currentStatIndex];

  // Cycle through analytics stats every 5 seconds
  useEffect(() => {
    if (!analyticsData) return;

    const interval = setInterval(() => {
      setCurrentStatIndex((prevIndex) => (prevIndex + 1) % stats.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [analyticsData, stats.length]);

  return (
    <div className="dashboard-container">
      <h1>Welcome, {user?.username}!</h1>
      <div className="dashboard-widget-container">
        <DashboardWidget
          title="Incidents"
          value={incidentCount ?? "Loading..."}
          description="View Incidents"
          link="/incidents"
          icon="fas fa-exclamation-circle"
          color="#ad7f2a"
        />
        <DashboardWidget
          title="Analytics"
          value={currentStat.value}
          description={currentStat.description}
          link="/analytics"
          icon="fas fa-chart-line"
          color="#67a387"
        />
      </div>
    </div>
  );
};

export default Dashboard;
