const express = require('express');
const { getSchools, getSchool, addSchool, updateSchool, deleteSchool } = require('../controllers/schoolController');
const authMiddleware = require('../middleware/authMiddleware'); // Import authentication middleware

const router = express.Router();

// @route   GET /api/schools
// @desc    Get all schools (Public)
// @access  Public
router.get('/', getSchools);

// @route   GET /api/schools/:id
// @desc    Get a single school by ID (Protected)
// @access  Private (Requires Authentication)
router.get('/:id', authMiddleware, getSchool);

// @route   POST /api/schools
// @desc    Add a new school (Protected)
// @access  Private (Requires Authentication)
router.post('/', authMiddleware, addSchool);

// @route   PUT /api/schools/:id
// @desc    Update a school by ID (Protected)
// @access  Private (Requires Authentication)
router.put('/:id', authMiddleware, updateSchool);

// @route   DELETE /api/schools/:id
// @desc    Delete a school by ID (Protected)
// @access  Private (Requires Authentication)
router.delete('/:id', authMiddleware, deleteSchool);

module.exports = router;
