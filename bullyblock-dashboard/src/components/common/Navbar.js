import React, { useState } from 'react';
import './Navbar.css'
import logo from '../../assets/images/logo3-white.svg';

const Navbar = () => {
    // State to track whether the menu is open or closed
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Toggles the menu state between open and closed
    const handleMenuToggle = () => {
        setIsMenuOpen((prev) => !prev);
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
            <div className={navLinksClass}>
                <a href="../../pages/Dashboard">Home</a>
                <a href="../../pages/Incidents">Incidents</a>
                <a href="../../pages/Login">Analytics</a>
            </div>
        </nav>
        
    );
};

export default Navbar;