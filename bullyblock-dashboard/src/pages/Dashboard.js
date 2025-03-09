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
        const [bulliesRes, schoolsRes, datesRes] = await Promise.all([
          axios.get(`${baseURL}/analytics/frequent-bullies`),
          axios.get(`${baseURL}/analytics/schools-bullying`),
          axios.get(`${baseURL}/analytics/dates-bullying`),
        ]);

        setAnalyticsData({
          frequentBullies: bulliesRes.data[0],
          schoolsMostBullying: schoolsRes.data[0],
          datesHighestBullying: datesRes.data[0],
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    };

    fetchAnalytics();
  }, []);

  // Cycle through analytics stats every 5 seconds
  useEffect(() => {
    if (!analyticsData) return;

    const interval = setInterval(() => {
      setCurrentStatIndex((prevIndex) => (prevIndex + 1) % 3);
    }, 5000);

    return () => clearInterval(interval);
  }, [analyticsData]);

  // Get current analytics stat
  const getCurrentStat = () => {
    if (!analyticsData)
      return { value: "Loading...", description: "View Bullying Trends" };

    const stats = [
      {
        value: analyticsData.frequentBullies.incidents,
        description: `Most Incidents: ${analyticsData.frequentBullies.name}`,
      },
      {
        value: analyticsData.schoolsMostBullying.incidents,
        description: `Highest School Rate: ${analyticsData.schoolsMostBullying.school}`,
      },
      {
        value: `Max ${analyticsData.datesHighestBullying.incidents} Incidents`,
        description: `Peak Date: ${new Date(
          analyticsData.datesHighestBullying.date
        ).toLocaleDateString()}`,
      },
    ];

    return stats[currentStatIndex];
  };

  const currentStat = getCurrentStat();

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
