const express = require('express');
const router = express.Router();  
const { createPost, getAllPosts, getPost, getPostByCanvasId, updatePost, deletePost, searchPosts } = require('../controllers/postController');
const authMiddleware  = require('../middleware/authMiddleware'); // Ensure correct import

// Route to create a new post (Private)
router.post('/', authMiddleware, createPost);

// Route to get all posts (Public)
router.get('/', getAllPosts);

// Get post by canvas id (private)
router.get('/canvas-id/:post_id', authMiddleware, getPostByCanvasId)

router.get('/search', searchPosts);

// Route to get a single post by ID (Public)
router.get('/:id', getPost);

// Route to update a post by ID (Private)
router.put('/:id', authMiddleware, updatePost);

// Route to delete a post by ID (Private)
router.delete('/:id', authMiddleware, deletePost);


// Export the router
module.exports = router;
