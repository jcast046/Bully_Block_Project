const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Load environment variables

const generatedUserId = () => {
    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000); // Generate random 10-digit number
    return `u${randomNumber}`; // Prefix with u
}

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
const registerUser = async (req, res) => {
    const { user_id, role, username, email, password } = req.body;

    // Validate required fields
    if (!role || !username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Check if user already exists
        console.log("Checking if user already exists"); // Debugging
        let existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate unique user_id
        let newUserId;
        let isUnique = false;

        console.log("Generating unique user_id"); // Debugging
        while (!isUnique) {
            newUserId = generatedUserId();
            const existingId = await User.findOne({ user_id: newUserId });
            if (!existingId) isUnique = true;
        }

        console.log("Generated user_id:", newUserId); // Debugging

        // Create new user
        console.log("Creating new user"); // Debugging
        const user = new User({ 
            user_id: newUserId,
            role, 
            username, 
            email, 
            password: hashedPassword });
        await user.save();
        console.log("User saved to database"); // Debugging

        // Generate JWT Token
        console.log("Generating JWT Token"); // Debugging
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ message: "User registered successfully", user, token });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// @route   POST /api/users/login
// @desc    Authenticate user and get token
// @access  Public
const loginUser = async (req, res) => {
    console.log("Incoming Login Request:", req.body); // Debugging

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Find user by email
        console.log("Searching for user..."); // Debugging
        const user = await User.findOne({ email });
        if (!user) {
            console.error("User not found"); // Debugging
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.error("Invalid password"); // Debugging
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate JWT Token
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, message: "Login successful", user });

    } catch (err) {
        console.error("Login error:", err); // Debugging
        res.status(500).json({ error: 'Server error' });
    }
};

// @route   GET /api/users
// @desc    Get all users (Protected)
// @access  Private (Admin only)
const getUsers = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// @route   GET /api/users/:id
// @desc    Get one user by ID (Protected)
// @access  Private
const getUser = async (req, res) => {
    res.json(res.resource);
};

// @route   PUT /api/users/:id
// @desc    Update user (Protected)
// @access  Private
const updateUser = async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// @route   DELETE /api/users/:id
// @desc    Delete a user (Protected)
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const deletedUser = await User.findByIdAndDelete(req.params.id);

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { loginUser, registerUser, loginUser, getUsers, getUser, updateUser, deleteUser };
