const express = require('express');
const { createIncident, getAllIncidents, getIncident, getIncidentCount, updateIncident, deleteIncident } = require('../controllers/incidentController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Public routes

/**
 * @route   GET /api/incidents
 * @desc    Retrieve all incidents
 * @access  Public (No authentication required)
 */
router.get('/', getAllIncidents);

/**
 * @route   GET /api/incidents/count
 * @desc    Retrieve the total number of incidents
 * @access  Public (No authentication required)
 */
router.get("/count", getIncidentCount);

/**
 * @route   GET /api/incidents/:id
 * @desc    Retrieve a specific incident by ID
 * @access  Public (No authentication required)
 */
router.get('/:id', getIncident);

// Private routes (authentication required)

/**
 * @route   POST /api/incidents
 * @desc    Create a new incident
 * @access  Private (Authentication required)
 * @middleware authMiddleware
 */
router.post('/', authMiddleware, createIncident);

/**
 * @route   PUT /api/incidents/:id
 * @desc    Update an existing incident by ID
 * @access  Private (Authentication required)
 * @middleware authMiddleware
 */
router.put('/:id', authMiddleware, updateIncident);

/**
 * @route   DELETE /api/incidents/:id
 * @desc    Delete a specific incident by ID
 * @access  Private (Authentication required)
 * @middleware authMiddleware
 */
router.delete('/:id', authMiddleware, deleteIncident);

/**
 * Export the incident-related route definitions.
 * @module routes/incidents
 */
module.exports = router;
