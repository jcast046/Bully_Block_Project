const express = require('express');
const router = express.Router();  
const { createPost, getAllPosts, getPost, getPostByCanvasId, updatePost, deletePost, searchPosts } = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware'); // Ensure correct import

// Route to create a new post (Private)
/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Private (Authentication required)
 * @middleware authMiddleware
 */
router.post('/', authMiddleware, createPost);

// Route to get all posts (Public)
/**
 * @route   GET /api/posts
 * @desc    Retrieve all posts
 * @access  Public (No authentication required)
 */
router.get('/', getAllPosts);

// Get post by canvas id (Private)
/**
 * @route   GET /api/posts/canvas-id/:post_id
 * @desc    Retrieve a specific post by its canvas ID
 * @access  Private (Authentication required)
 * @middleware authMiddleware
 */
router.get('/canvas-id/:post_id', authMiddleware, getPostByCanvasId);

// Search posts (Public)
/**
 * @route   GET /api/posts/search
 * @desc    Search posts based on query parameters
 * @access  Public (No authentication required)
 */
router.get('/search', searchPosts);

// Route to get a single post by ID (Public)
/**
 * @route   GET /api/posts/:id
 * @desc    Retrieve a single post by ID
 * @access  Public (No authentication required)
 */
router.get('/:id', getPost);

// Route to update a post by ID (Private)
/**
 * @route   PUT /api/posts/:id
 * @desc    Update a post by its ID
 * @access  Private (Authentication required)
 * @middleware authMiddleware
 */
router.put('/:id', authMiddleware, updatePost);

// Route to delete a post by ID (Private)
/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post by its ID
 * @access  Private (Authentication required)
 * @middleware authMiddleware
 */
router.delete('/:id', authMiddleware, deletePost);

// Export the router
/**
 * Export the post-related route definitions.
 * @module routes/posts
 */
module.exports = router;
