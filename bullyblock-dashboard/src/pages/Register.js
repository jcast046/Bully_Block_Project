import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from "react-router";
import Button from '../components/common/Button';
import '../App.css';

const Register = () => {
    const baseURL = 'http://localhost:3001/api'; // Base URL for API

    // State to handle form data for registration
    const [formData, setFormData] = useState({
        role: "",
        username: "",
        email: "",
        password: "",
    });

    const navigate = useNavigate(); // Allows navigation to different pages

    // Handle input changes and update form state
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        try {
            console.log("Form Data Sent:", formData);
            await axios.post(`${baseURL}/users/register`, formData, {
                headers: {
                    "Content-Type": "application/json"
                }
            });
            alert("User registered successfully");
            navigate("/login"); // Redirect user to the login page
        } catch (error) {
            console.error("Error registering user", error); // Log error for debugging
            alert(error.response?.data?.message || "Registration failed"); // Notify user of failure
        }
    };

    return (
        <div className="register-container">
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <label>
                    Role:
                    <select name="role" value={formData.role} onChange={handleChange} required>
                        <option value="">Select Role</option>
                        <option value="admin">Admin</option>
                        <option value="teacher">Teacher</option>
                    </select>
                </label>
                <br />
                <label>
                    Username:
                    <input type="text" name="username" value={formData.username} onChange={handleChange} required />
                </label>
                <br />
                <label>
                    Email:
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </label>
                <br />
                <label>
                    Password:
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                </label>
                <br />
                <Button text="Register" type="submit" /> {/* Custom button component for form submission */}
                <Link to='/login' className="link"><h3>Return to Login</h3></Link> {/* Link to navigate back to login page */}
            </form>
        </div>
    );
};

export default Register;
