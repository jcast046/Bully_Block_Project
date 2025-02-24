import React, { useContext, useState } from 'react';
import { AuthContext } from '../AuthContext';
import { useNavigate } from 'react-router';
import axios from 'axios';
import '../App.css';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Hidden Icon
import Button from '../components/common/Button';

const Login = () => {
    const { login } = useContext(AuthContext);               // Access login function
    const [username, setUsername] = useState('');            // Username input
    const [password, setPassword] = useState('');            // Password input
    const [error, setError] = useState('');                  // Error messages
    const [showPassword, setShowPassword] = useState(false); // Password visibility
    const navigate = useNavigate();                          // Initialize navigate function

    const baseURL = 'http://localhost:3001/api'; // Base URL for API

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(`${baseURL}/users/login`, {
                email: username,
                password: password,
            }, {
                headers: { "content-Type": "application/json" }
            });

            console.log("Login Successful:", response.data);

            // Store JWT token in local storage
            localStorage.setItem("token", response.data.token);

            // Call the context login function with user data
            login(response.data.user);

            // Redirect to dashboard
            navigate('/dashboard');
        } catch (error) {
            console.error("Login Error:", error.response?.data || error.message);
            setError(error.response?.data?.error || "Login failed");
        }
    };

    // Toggles password visibility
    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    return (
        <div className="login-container">
            <h1>Welcome to BullyBlock</h1>
            <form onSubmit={handleSubmit} data-testid="login-form">
                <label>
                    Email:
                    <input type="email" value={username} onChange={(e) => setUsername(e.target.value)} />
                </label>
                <label>
                    Password:
                    <div className="password-input-container">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <i
                            className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} password-toggle-icon`}
                            onClick={togglePasswordVisibility}
                        ></i>
                    </div>
                </label>
                <Button text="Login" type="submit" />
                <Button text="Register" onClick={() => navigate('/register')} />
            </form>
            {error && <p className="error">{error}</p>}
        </div>
    );
};

export default Login;
