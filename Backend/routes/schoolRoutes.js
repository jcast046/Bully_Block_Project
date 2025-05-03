const express = require('express');
const { getSchools, getSchool, addSchool, updateSchool, deleteSchool } = require('../controllers/schoolController');
const authMiddleware = require('../middleware/authMiddleware'); // Import authentication middleware

const router = express.Router();

// @route   GET /api/schools
// @desc    Get all schools
// @access  Public (No authentication required)
/**
 * @route   GET /api/schools
 * @desc    Retrieve a list of all schools
 * @access  Public (No authentication required)
 */
router.get('/', getSchools);

// @route   GET /api/schools/:id
// @desc    Get a single school by ID (Protected)
// @access  Private (Authentication required)
/**
 * @route   GET /api/schools/:id
 * @desc    Retrieve a specific school by its ID
 * @access  Private (Authentication required)
 * @middleware authMiddleware
 */
router.get('/:id', authMiddleware, getSchool);

// @route   POST /api/schools
// @desc    Add a new school (Protected)
// @access  Private (Authentication required)
/**
 * @route   POST /api/schools
 * @desc    Add a new school to the database
 * @access  Private (Authentication required)
 * @middleware authMiddleware
 */
router.post('/', authMiddleware, addSchool);

// @route   PUT /api/schools/:id
// @desc    Update a school by ID (Protected)
// @access  Private (Authentication required)
/**
 * @route   PUT /api/schools/:id
 * @desc    Update an existing school by its ID
 * @access  Private (Authentication required)
 * @middleware authMiddleware
 */
router.put('/:id', authMiddleware, updateSchool);

// @route   DELETE /api/schools/:id
// @desc    Delete a school by ID (Protected)
// @access  Private (Authentication required)
/**
 * @route   DELETE /api/schools/:id
 * @desc    Delete a school from the database by its ID
 * @access  Private (Authentication required)
 * @middleware authMiddleware
 */
router.delete('/:id', authMiddleware, deleteSchool);

// Export the router
/**
 * Export the school-related route definitions.
 * @module routes/schools
 */
module.exports = router;
