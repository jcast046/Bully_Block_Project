const express = require('express');
const { getBullyReports, addBullyReport } = require('../controllers/bullyController');
const authMiddleware = require('../middleware/authMiddleware'); // Import authentication middleware

const router = express.Router();

/**
 * @route   GET /api/bully
 * @desc    Retrieve all bully reports
 * @access  Private (Requires Authentication)
 * @middleware authMiddleware
 */
router.get('/', authMiddleware, getBullyReports);

/**
 * @route   POST /api/bully
 * @desc    Add a new bully report
 * @access  Private (Requires Authentication)
 * @middleware authMiddleware
 */
router.post('/', authMiddleware, addBullyReport);

/**
 * Export the route definitions for bully-related operations.
 * @module routes/bully
 */
module.exports = router;
