import React, { useContext, useState } from 'react';
import { AuthContext } from '../AuthContext'; 
import { useNavigate } from 'react-router';
import axios from 'axios'; // Import axios for API calls
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

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Send login request to backend
            const response = await axios.post('/api/users/login', { email: username, password });
            
            if (response.data.token) {
                login(response.data.token);                 // Store token in context/local storage
                navigate('/dashboard');                     // Redirect to dashboard after login
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        }
    };

    // Toggles password visibility
    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    return (
        <div className="login-container">
            <h1>Welcome to BullyBlock</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Email:
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
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
            </form>
            {error && <p className="error">{error}</p>}
        </div>
    );
};

export default Login;
