const express = require('express');
const { getBullyReports, addBullyReport } = require('../controllers/bullyController');
const authMiddleware = require('../middleware/authMiddleware'); // Import authentication middleware

const router = express.Router();

// @route   GET /api/bully
// @desc    Get all bully reports (Protected)
// @access  Private (Requires Authentication)
router.get('/', authMiddleware, getBullyReports);

// @route   POST /api/bully
// @desc    Add a new bully report (Protected)
// @access  Private (Requires Authentication)
router.post('/', authMiddleware, addBullyReport);

module.exports = router;
