import React from 'react';
import './Footer.css';
import logo from '../../assets/images/logo3-white.svg';

const Footer = () => {
    const preventDefault = (e) => {
        e.preventDefault();
    };
    
// Note: Compile gives warnings because, as of now, the Privacy Policy, Terms of service, and Contact Us link to nothing
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-logo">
                    <img src={logo} alt="BullyBlock Logo" />
                </div>
                <div className="footer-links">
                    <a href="#" onClick={preventDefault}>Privacy Policy</a>
                    <a href="#" onClick={preventDefault}>Terms of Service</a>
                    <a href="#" onClick={preventDefault}>Contact Us</a>
                </div>
            </div>
            <p>&copy; 2025 BullyBlock. All rights reserved.</p>
        </footer>
    );
};

export default Footer;
