const express = require('express');
const { createMessage, getAllMessages, getMessage, deleteMessage, searchMessages } = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes

/**
 * @route   GET /api/messages
 * @desc    Retrieve all messages
 * @access  Public (No authentication required)
 */
router.get('/', getAllMessages);

/**
 * @route   GET /api/messages/search
 * @desc    Search for messages based on query parameters
 * @access  Public (No authentication required)
 */
router.get('/search', searchMessages);

/**
 * @route   GET /api/messages/:id
 * @desc    Retrieve a specific message by ID
 * @access  Public (No authentication required)
 */
router.get('/:id', getMessage);

// Protected routes

/**
 * @route   POST /api/messages
 * @desc    Create a new message
 * @access  Private (Authentication required)
 * @middleware authMiddleware
 */
router.post('/', authMiddleware, createMessage);

/**
 * @route   DELETE /api/messages/:id
 * @desc    Delete a specific message by ID
 * @access  Private (Authentication required)
 * @middleware authMiddleware
 */
router.delete('/:id', authMiddleware, deleteMessage);

/**
 * Export the message-related route definitions.
 * @module routes/messages
 */
module.exports = router;
