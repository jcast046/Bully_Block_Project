import React from 'react';
import './Button.css';

const Button = ({ text, onClick, type = 'button', className='', disabled = false }) => {
    return (
        <button 
            className={`custom-button ${className}`} 
            type={type} 
            onClick={onClick}
            disabled={disabled}
        >
            {text}
        </button>
    );
};

export default Button;