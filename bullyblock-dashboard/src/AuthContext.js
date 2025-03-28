import React, { createContext, useState, useEffect } from 'react';

// Create a new context for authentication
export const AuthContext = createContext();

// Create a provider component for the authentication context
export const AuthProvider = ({ children }) => {
    // State to track whether the user is authenticated
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // State to store user information
    const [user, setUser] = useState(null);

    // State to track whether authentication state is being restored
    const [loading, setLoading] = useState(true); // New state for initialization

    // Restore authentication state from localStorage on load
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token'); // Optional: Check for token validity
        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }
        setLoading(false); // Mark initialization as complete
    }, []);

    // Function to log in the user
    const login = (userData) => {
        setIsAuthenticated(true);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData)); // Persist user data in localStorage
        localStorage.setItem('token', userData.token); // Persist token for session management
    };

    // Function to log out the user
    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('user'); // Remove user data from localStorage
        localStorage.removeItem('token'); // Remove token from localStorage
    };

    // Provide the authentication state and login/logout functions to child components
    // Add a conditional rendering based on the loading state
    if (loading) {
        return <div>Loading...</div>; // Display a loading spinner or message during initialization
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
