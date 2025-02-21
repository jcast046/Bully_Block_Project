const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables

const generatedUserId = () => {
    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000); // Generate random 10-digit number
    return `u${randomNumber}`; // Prefix with u
}

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
const registerUser = async (req, res) => {
    const { user_id, role, username, email, password, referencedID } = req.body;

    // Validate required fields
    if (!role || !username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate referencedID if provided
    if (referencedID && !mongoose.Types.ObjectId.isValid(referencedID)) {
        return res.status(400).json({ error: 'Invalid referencedID' });
    }

    try {
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

        while (!isUnique) {
            newUserId = generatedUserId();
            const existingId = await User.findOne({ user_id: newUserId });
            if (!existingId) isUnique = true;
        }

        // Create new user
        const user = new User({ 
            user_id: newUserId,
            role, 
            username, 
            email, 
            password: hashedPassword,
            referencedID
        });
        await user.save();

        // Generate JWT Token
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
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, message: "Login successful", user });

    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// @route   POST /api/users/register-student
// @desc    Register a new student
// @access  Private
const registerStudent = async (req, res) => {
    const { user_id, username } = req.body;

    // Validate required fields
    if (!user_id || !username) {
        return res.status(400).json({ error: 'user_id and username are required' });
    }

    try {
        // Check if the username already exists
        let existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Check if the user_id already exists
        let existingId = await User.findOne({ user_id });
        if (existingId) {
            return res.status(400).json({ error: 'User ID already exists' });
        }

        // Create new student user
        const student = new User({ 
            user_id, 
            role: 'student', 
            username
        });

        await student.save();

        res.status(201).json({ message: "Student registered successfully", student });
    } catch (err) {
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

        const users = await User.find().populate('referencedID');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// @route GET /api/users/canvas-id/user_id
// @desc Get user by their canvas id
// @access Private
const getUserByCanvasId = async (req, res) => {
    try {
        const user = await User.findOne({ user_id: req.params.user_id }).populate('referencedID');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @route   GET /api/users/:id
// @desc    Get one user by ID (Protected)
// @access  Private
const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('referencedID');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @route   PUT /api/users/:id
// @desc    Update user (Protected)
// @access  Private
const updateUser = async (req, res) => {
    try {
        if (req.body.referencedID && !mongoose.Types.ObjectId.isValid(req.body.referencedID)) {
            return res.status(400).json({ error: 'Invalid referencedID' });
        }

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

module.exports = { registerUser, loginUser, registerStudent, getUsers, getUserByCanvasId, getUser, updateUser, deleteUser };
