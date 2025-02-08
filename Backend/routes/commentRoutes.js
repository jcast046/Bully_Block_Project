const express = require('express');
const { createComment, getAllComments, getComment, deleteComment } = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', getAllComments);  // Get all comments (no authentication needed)
router.get('/:id', getComment);   // Get a comment by ID (no authentication needed)

// Protected routes
router.post('/', authMiddleware, createComment);  // Create a new comment (authentication required)
router.delete('/:id', authMiddleware, deleteComment);  // Delete a comment by ID (authentication required)

module.exports = router;
