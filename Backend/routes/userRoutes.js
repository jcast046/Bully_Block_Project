const express = require('express');
const { getUsers, getUser, registerUser, registerStudent, updateUser, deleteUser, loginUser, getUserByCanvasId } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware'); // Import authentication middleware
const getResource = require('../middleware/getResource');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Protected)
// @access  Private (Requires Authentication)
router.get('/', authMiddleware, getUsers);

router.get('/canvas-id/:user_id', getUserByCanvasId);

// @route   GET /api/users/:id
// @desc    Get a single user by ID (Protected)
// @access  Private (Requires Authentication)
router.get('/:id', authMiddleware, getResource(User), getUser);

// @route POST /api/users/register-student
// @desc  Add a new student to database
// @access public
router.post('/register-student', registerStudent);

// @route   POST /api/users
// @desc    Register a new user (Public)
// @access  Public (No Authentication Required)
router.post('/register', registerUser); 

// @route   POST /api/users/login
// @desc    Login user (Public)
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
