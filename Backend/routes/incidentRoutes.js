const express = require('express');
const {createIncident, getAllIncidents, getIncident, updateIncident, deleteIncident} = require('../controllers/incidentController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getAllIncidents);

router.get('/:id', getIncident);

router.post('/', createIncident);

router.put('/:id', updateIncident);

router.delete('/:id', deleteIncident);

module.exports = router;