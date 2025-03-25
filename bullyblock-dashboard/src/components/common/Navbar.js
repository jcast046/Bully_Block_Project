import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import "./Navbar.css";
import logo from "../../assets/images/logo3-white.svg";
import { AuthContext } from "../../AuthContext";
import Button from "../common/Button";
import NotificationPopUp from "../common/NotificationPopUp";

const Navbar = () => {
  // State to track whether the menu is open or closed
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Access the isAuthenticated and logout functions from AuthContext
  const { isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation(); // Access the current location

  // Redirect to login page if user is not authenticated and trying to access other pages
  useEffect(() => {
  }, [isAuthenticated, location, navigate]);

  // Toggles the menu state between open and closed
  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => !prev);
  };

  // Handles the logout process
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Dynamically sets the class name depending on the menu state
  const menuToggleClass = `menu-toggle ${isMenuOpen ? "open" : ""}`;
  const navLinksClass = `nav-links ${isMenuOpen ? "open" : "close"}`;

  // Render logo only and hide navigation options on the login page
  const isLoginPage = location.pathname === "/login";

  return (
    <nav>
      <div className="nav-header">
        <div className="nav-logo">
          <img src={logo} alt="BullyBlock Logo" />
        </div>
        {!isLoginPage && (
          <>
            <div className={menuToggleClass} onClick={handleMenuToggle}>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
            {isAuthenticated && (
              <div className={navLinksClass}>
                <Link to="/dashboard">Home</Link>
                <Link to="/incidents">Incidents</Link>
                <Link to="/analytics">Analytics</Link>
                <div className="/Notifications">
                  <NotificationPopUp />
                </div>
                <Button
                  text="Logout"
                  onClick={handleLogout}
                  className="logout-button"
                />
              </div>
            )}
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
