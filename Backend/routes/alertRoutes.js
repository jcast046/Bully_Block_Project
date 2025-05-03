const express = require('express');
const router = express.Router();
const Alert = require("../models/Alert");

/**
 * @route   GET /count
 * @desc    Get the total number of alerts in the database
 * @access  Public
 */
router.get("/count", async (req, res) => {
    try {
        const count = await Alert.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: "Server error while fetching incidents" });
    }
});

/**
 * Export the router containing alert-related routes.
 * @module routes/alert
 */
module.exports = router;
