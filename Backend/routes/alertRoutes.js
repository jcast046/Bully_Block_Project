const express = require('express');
const router = express.Router();
const Alert = require("../models/Alert");

// GET total count of incidents
router.get("/count", async (req, res) => {
    try {
        const count = await Alert.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: "Server error while fetching incidents" });
    }
});

module.exports = router;