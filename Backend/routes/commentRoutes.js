const express = require('express');
const { createComment, getAllComments, getCommentByCanvasId, getComment, deleteComment, searchComments } = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes

/**
 * @route   GET /api/comments
 * @desc    Retrieve all comments
 * @access  Public (No authentication required)
 */
router.get('/', getAllComments);

/**
 * @route   GET /api/comments/search
 * @desc    Search for comments based on query parameters
 * @access  Public (No authentication required)
 */
router.get('/search', searchComments);

/**
 * @route   GET /api/comments/canvas-id/:comment_id
 * @desc    Get a comment by its canvas ID
 * @access  Private (Authentication required)
 * @middleware authMiddleware
 */
router.get('/canvas-id/:comment_id', authMiddleware, getCommentByCanvasId);

/**
 * @route   GET /api/comments/:id
 * @desc    Retrieve a specific comment by ID
 * @access  Public (No authentication required)
 */
router.get('/:id', getComment);

// Protected routes

/**
 * @route   POST /api/comments
 * @desc    Create a new comment
 * @access  Private (Authentication required)
 * @middleware authMiddleware
 */
router.post('/', authMiddleware, createComment);

/**
 * @route   DELETE /api/comments/:id
 * @desc    Delete a specific comment by ID
 * @access  Private (Authentication required)
 * @middleware authMiddleware
 */
router.delete('/:id', authMiddleware, deleteComment);

/**
 * Export the comment-related routes.
 * @module routes/comments
 */
module.exports = router;
