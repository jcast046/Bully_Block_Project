const express = require('express');
const {createIncident, getAllIncidents, getIncident, getIncidentCount, updateIncident, deleteIncident} = require('../controllers/incidentController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getAllIncidents);

// GET total count of incidents
router.get("/count", getIncidentCount);

router.get('/:id', getIncident);

router.post('/', createIncident);

router.put('/:id', updateIncident);

router.delete('/:id', deleteIncident);

module.exports = router;