const express = require('express');
const {createIncident, getAllIncidents, getIncident, getIncidentCount, updateIncident, deleteIncident} = require('../controllers/incidentController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Public routes
router.get('/', getAllIncidents);
router.get("/count", getIncidentCount);
router.get('/:id', getIncident);

// Private routes (authentication required)
router.post('/', authMiddleware, createIncident);
router.put('/:id', authMiddleware, updateIncident);
router.delete('/:id', authMiddleware, deleteIncident);

module.exports = router;
