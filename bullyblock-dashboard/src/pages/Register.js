import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from "react-router";
import Button from '../components/common/Button';
import '../App.css';

const Register = () => {
    const [formData, setFormData] = useState({
        role: "",
        username: "",
        email: "",
        password: "",
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:3001/api/users/register', formData)
            alert("User registered successfully");
            navigate("/login");
        } catch (error) {
            console.error("Error registering user", error);
            alert(error.response?.data?.message || "Registration failed")
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
                <Button text="Register" type="submit"/>
                <Link to='/login' className="link"><h3>Return to Login</h3></Link>
            </form>
        </div>
    );
};

export default Register;
