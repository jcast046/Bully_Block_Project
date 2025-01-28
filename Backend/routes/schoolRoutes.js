const express = require('express');
const { getSchools, addSchool, getSchool, updateSchool, deleteSchool } = require('../controllers/schoolController');
const getResource = require('../middleware/getResource');
const School = require('../models/School');

const router = express.Router();

// Get all schools
router.get('/', getSchools);

// Get a single school by ID 
router.get('/:id', getResource(School), getSchool);

// Add a new school
router.post('/', addSchool);

// Update a school
router.put('/:id', getResource(School), updateSchool);

// Delete a school
router.delete('/:id', deleteSchool);

module.exports = router;
