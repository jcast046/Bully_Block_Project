const express = require('express');
const { getUsers, getUser, registerUser, registerStudent, updateUser, deleteUser, loginUser, getUserByCanvasId } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware'); // Import authentication middleware
const getResource = require('../middleware/getResource');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Requires Authentication)
/**
 * @route   GET /api/users
 * @desc    Retrieve a list of all users
 * @access  Private (Authentication required)
 * @middleware authMiddleware
 */
router.get('/', authMiddleware, getUsers);

// @route GET /api/users/canvas-id/:user_id
// @desc Get user by their canvas id
// @access Private
/**
 * @route   GET /api/users/canvas-id/:user_id
 * @desc    Retrieve a user by their canvas ID
 * @access  Private (Authentication required)
 * @middleware authMiddleware
 */
router.get('/canvas-id/:user_id', authMiddleware, getUserByCanvasId);

// @route   GET /api/users/:id
// @desc    Get a single user by ID (Protected)
// @access  Private (Requires Authentication)
/**
 * @route   GET /api/users/:id
 * @desc    Retrieve a specific user by their ID
 * @access  Private (Authentication required)
 * @middleware authMiddleware, getResource
 */
router.get('/:id', authMiddleware, getResource(User), getUser);

// @route POST /api/users/register-student
// @desc  Add a new student to the database
// @access private
/**
 * @route   POST /api/users/register-student
 * @desc    Register a new student
 * @access  Private (Authentication required)
 * @middleware authMiddleware
 */
router.post('/register-student', authMiddleware, registerStudent);

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public (No Authentication Required)
/**
 * @route   POST /api/users/register
 * @desc    Register a new user to the system
 * @access  Public (No authentication required)
 */
router.post('/register', registerUser); 

// @route   POST /api/users/login
// @desc    Login user
// @access  Public (No Authentication Required)
/**
 * @route   POST /api/users/login
 * @desc    Login a user to the system
 * @access  Public (No authentication required)
 */
router.post('/login', loginUser);

// @route   PUT /api/users/:id
// @desc    Update user by ID
// @access  Private (Requires Authentication)
/**
 * @route   PUT /api/users/:id
 * @desc    Update a user's details by their ID
 * @access  Private (Authentication required)
 * @middleware authMiddleware, getResource
 */
router.put('/:id', authMiddleware, getResource(User), updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete user by ID
// @access  Private (Requires Authentication)
/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user by their ID
 * @access  Private (Authentication required)
 * @middleware authMiddleware
 */
router.delete('/:id', authMiddleware, deleteUser);

// Export the router
/**
 * Export the user-related route definitions.
 * @module routes/users
 */
module.exports = router;
