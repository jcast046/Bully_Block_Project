import React from 'react';
import './Navbar.css'
import logo from '../../assets/images/logo3-white.svg';

const Navbar = () => {
    return (
        <nav>
            <div className="nav-logo">
                <img src={logo} alt="BullyBlock Logo"/>
            </div>
            <div className="nav-links">
                <a href="../../pages/Dashboard">Home</a>
                <a href="../../pages/Incidents">Incidents</a>
                <a href="../../pages/Login">Analytics</a>
            </div>
        </nav>
    );
};

export default Navbar;