const express = require('express');
const { getUsers, getUser, registerUser, updateUser, deleteUser } = require('../controllers/userController');
const { loginUser } = require('../controllers/authController'); // Import loginUser
const authMiddleware = require('../middleware/authMiddleware'); // Import authentication middleware
const getResource = require('../middleware/getResource');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Protected)
// @access  Private (Requires Authentication)
router.get('/', authMiddleware, getUsers);

// @route   GET /api/users/:id
// @desc    Get a single user by ID (Protected)
// @access  Private (Requires Authentication)
router.get('/:id', authMiddleware, getResource(User), getUser);

// @route   POST /api/users
// @desc    Register a new user (Public)
// @access  Public (No Authentication Required)
router.post('/', registerUser); 

// @route   POST /api/users/login
// @desc    Authenticate user & get token (Public)
// @access  Public (No Authentication Required)
router.post('/login', loginUser);

// @route   PUT /api/users/:id
// @desc    Update user by ID (Protected)
// @access  Private (Requires Authentication)
router.put('/:id', authMiddleware, getResource(User), updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete user by ID (Protected)
// @access  Private (Requires Authentication)
router.delete('/:id', authMiddleware, deleteUser);

module.exports = router;
