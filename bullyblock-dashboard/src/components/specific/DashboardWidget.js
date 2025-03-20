import React from "react";
import { useNavigate } from "react-router";
import "./DashboardWidget.css";

const DashboardWidget = ({ title, value, description, link, icon, color }) => {
  const navigate = useNavigate();
  return (
    <div
      className="dashboard-widget"
      onClick={() => navigate(link)}
      style={{ borderLeft: `5px solid ${color}`, cursor: "pointer" }}
      data-testid="dashboard-widget"
    >
      <div className="widget-header">
        <i className={`widget-icon ${icon}`}></i>
        <h4>{title}</h4>
      </div>
      <div className="widget-body">
        <div className="stat-container">
          <h2 key={value} className="stat-value">
            {value}
          </h2>
          <p key={description} className="stat-description">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardWidget;
