import React, { useContext, useState } from 'react';
import { AuthContext } from '../AuthContext'; 
import { useNavigate } from 'react-router';
import '../App.css';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Hidden Icon
import Button from '../components/common/Button';

// Valid user credentials
const validCredentials = [
    { username: 'Jacob', password: 'Braley' },
    { username: 'Joshua', password: 'Castillo' },
    { username: 'Reagan', password: 'McCoy' },
    { username: 'Trevor', password: 'Newberry' },
    { username: 'Nomar', password: 'Rodriguez' },
    { username: 'Peter', password: 'Spadaro' },
    { username: 'Skyler', password: 'Williams' },
];

const Login = () => {
    const { login } = useContext(AuthContext);               // Access login function
    const [username, setUsername] = useState('');            // Username input
    const [password, setPassword] = useState('');            // Password input
    const [error, setError] = useState('');                  // Error messages
    const [showPassword, setShowPassword] = useState(false); // Password visibility
    const navigate = useNavigate();                          // Initalize navigate function

    // Submit form
    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate user credentials
        const isValid = validCredentials.some(
            (cred) => cred.username === username && cred.password === password
        );

        if (isValid) {
            login();                                        // Call login function
            navigate('/dashboard');                         // Redirect to dashboard after login
        } else {
            setError('Invalid username or password');       // Error Message
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
                    Username:
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
                <Button text="Login" type="submit"/>
                <Button text="Register" onClick={() => navigate('/register')} />
            </form>
            {error && <p className="error">{error}</p>}
        </div>
    );
};

export default Login;
