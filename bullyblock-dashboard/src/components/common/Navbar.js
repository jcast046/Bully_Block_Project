import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import logo from '../../assets/images/logo3-white.svg';
import { AuthContext } from '../../AuthContext';
import Button from '../common/Button';

const Navbar = () => {
    // State to track whether the menu is open or closed
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Access the isAuthenticated and logout functions from AuthContext
    const { isAuthenticated, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    // Toggles the menu state between open and closed
    const handleMenuToggle = () => {
        setIsMenuOpen((prev) => !prev);
    };

    // Handles the logout process
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Dynamically sets the class name depending on the menu state
    const menuToggleClass = `menu-toggle ${isMenuOpen ? 'open' : ''}`;
    const navLinksClass = `nav-links ${isMenuOpen ? 'open' : 'close'}`;

    return (
        <nav>
            <div className="nav-header">
                <div className="nav-logo">
                    <img src={logo} alt="BullyBlock Logo"/>
                </div>
                <div className={menuToggleClass} onClick={handleMenuToggle}>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
            {isAuthenticated && (
                <div className={navLinksClass}>
                    <Link to="/dashboard">Home</Link>
                    <Link to="/incidents">Incidents</Link>
                    <Link to="/analytics">Analytics</Link>
                    <Button text="Logout" onClick={handleLogout} className="logout-button" />
                </div>
            )}
        </nav>
    );
};

export default Navbar;
