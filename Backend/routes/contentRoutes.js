const express = require('express');
const {createContent, getAllContent, getContent, updateContent, deleteContent} = require('../controllers/contentController');
const authMiddleware = require('../middleware/authMiddleware'); // Import authentication middleware

const router = express.Router();

// @route   GET /api/Content
// @desc    Get all Content(Protected)
// @access  Private (Requires Authentication)
router.get('/', getAllContent);

// @route   GET /api/content/:id
// @desc    Get a single content by ID (Protected)
// @access  Private (Requires Authentication)
router.get('/:id', getContent);

// @route   POST /api/content
// @desc    Register a new content (Public)
// @access  Public (No Authentication Required)
router.post('/', createContent);

// @route   PUT /api/content/:id
// @desc    Update content by ID (Protected)
// @access  Private (Requires Authentication)
router.put('/:id', updateContent);

// @route   DELETE /api/content/:id
// @desc    Delete content by ID (Protected)
// @access  Private (Requires Authentication)
router.delete('/:id', deleteContent);


module.exports = router;