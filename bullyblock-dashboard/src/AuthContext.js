import React, { createContext, useState, useEffect } from 'react';

// Create a new context for authentication
export const AuthContext = createContext();

// Create a provider component for the authentication context
export const AuthProvider = ({ children }) => {
    // State to track whether the user is authenticated
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // State to store user information
    const [user, setUser] = useState(null);

    // Restore authentication state from localStorage on load
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }
    }, []);

    // Function to log in the user
    const login = (userData) => {
        setIsAuthenticated(true);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData)); // Persist user data in localStorage
    };

    // Function to log out the user
    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('user'); // Remove user data from localStorage
    };

    // Provide the authentication state and login/logout functions to child components
    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
