import React from 'react';
import './Footer.css';

const Footer = () => {
    return (
        <footer>
            <p>&copy; 2024 BullyBlock. All rights reserved.</p>
            <div className="footer-links">
                <a href="/privacy-policy">Privacy Policy</a>
                <a href="/terms-of-service">Terms of Service</a>
                <a href="/contact-us">Contact Us</a>
            </div>
        </footer>     
    );
};

export default Footer;