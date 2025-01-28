import React, { createContext, useState } from 'react';

// Create a new context for authentication
export const AuthContext = createContext();

// Create a provider component for the authentication context
export const AuthProvider = ({ children }) => {

    // State to track whether the user is authenticated
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Function to log in the user
    const login = () => {
        setIsAuthenticated(true);
    };

    // Function to log out the user
    const logout = () => {
        setIsAuthenticated(false);
    };

    // Provide the authentication state and login/logout functions to child components
    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
