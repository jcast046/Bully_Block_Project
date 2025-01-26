const express = require('express');
const { getSchools, addSchool, getSchool } = require('../controllers/schoolController');
const getResource = require('../middleware/getResource');
const School = require('../models/School');

const router = express.Router();

// Get all schools
router.get('/', getSchools);

// Get a single school by ID 
router.get('/:id', getResource(School), getSchool);

// Add a new school
router.post('/', addSchool);

module.exports = router;
