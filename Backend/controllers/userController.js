const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables

/**
 * Generate a unique user ID prefixed with 'u'
 * @returns {string} - A unique 10-digit user ID string
 */
const generatedUserId = () => {
    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
    return `u${randomNumber}`;
};

/**
 * Register a new user
 * @route POST /api/users/register
 * @access Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const registerUser = async (req, res) => {
    const { user_id, role, username, email, password, referencedID } = req.body;

    if (!role || !username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (referencedID && !mongoose.Types.ObjectId.isValid(referencedID)) {
        return res.status(400).json({ error: 'Invalid referencedID' });
    }

    try {
        let existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let newUserId;
        let isUnique = false;
        while (!isUnique) {
            newUserId = generatedUserId();
            const existingId = await User.findOne({ user_id: newUserId });
            if (!existingId) isUnique = true;
        }

        const user = new User({
            user_id: newUserId,
            role,
            username,
            email,
            password: hashedPassword,
            referencedID
        });
        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ message: "User registered successfully", user, token });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Authenticate user and return JWT token
 * @route POST /api/users/login
 * @access Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
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

/**
 * Register a new student
 * @route POST /api/users/register-student
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const registerStudent = async (req, res) => {
    const { user_id, username } = req.body;

    if (!user_id || !username) {
        return res.status(400).json({ error: 'user_id and username are required' });
    }

    try {
        let existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        let existingId = await User.findOne({ user_id });
        if (existingId) {
            return res.status(400).json({ error: 'User ID already exists' });
        }

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

/**
 * Get all users
 * @route GET /api/users
 * @access Private (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
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

/**
 * Get a user by Canvas user_id
 * @route GET /api/users/canvas-id/:user_id
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
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

/**
 * Get a user by database ID
 * @route GET /api/users/:id
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
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

/**
 * Update user by ID
 * @route PUT /api/users/:id
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
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

/**
 * Delete a user by ID
 * @route DELETE /api/users/:id
 * @access Private (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
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

module.exports = {
    registerUser,
    loginUser,
    registerStudent,
    getUsers,
    getUserByCanvasId,
    getUser,
    updateUser,
    deleteUser
};
