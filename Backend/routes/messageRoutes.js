const express = require('express');
const { createMessage, getAllMessages, getMessage, deleteMessage } = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', getAllMessages);  // Get all messages (no authentication needed)
router.get('/:id', getMessage);   // Get a message by ID (no authentication needed)

// Protected routes
router.post('/', authMiddleware, createMessage);  // Create a new message (authentication required)
router.delete('/:id', authMiddleware, deleteMessage);  // Delete a message by ID (authentication required)

module.exports = router;
