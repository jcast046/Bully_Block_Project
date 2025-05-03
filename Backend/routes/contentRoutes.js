const express = require('express');
const { createContent, getAllContent, getContent, updateContent, deleteContent } = require('../controllers/contentController');
const authMiddleware = require('../middleware/authMiddleware'); // Import authentication middleware

const router = express.Router();

/**
 * @route   GET /api/content
 * @desc    Retrieve all content entries
 * @access  Private (Requires Authentication)
 * @middleware authMiddleware
 */
router.get('/', getAllContent);

/**
 * @route   GET /api/content/:id
 * @desc    Retrieve a single content entry by ID
 * @access  Private (Requires Authentication)
 * @middleware authMiddleware
 */
router.get('/:id', getContent);

/**
 * @route   POST /api/content
 * @desc    Create a new content entry
 * @access  Public (No Authentication Required)
 */
router.post('/', createContent);

/**
 * @route   PUT /api/content/:id
 * @desc    Update an existing content entry by ID
 * @access  Private (Requires Authentication)
 * @middleware authMiddleware
 */
router.put('/:id', updateContent);

/**
 * @route   DELETE /api/content/:id
 * @desc    Delete a specific content entry by ID
 * @access  Private (Requires Authentication)
 * @middleware authMiddleware
 */
router.delete('/:id', deleteContent);

/**
 * Export the content-related route definitions.
 * @module routes/content
 */
module.exports = router;
