const express = require("express");
const router = express.Router();
const {
  getFrequentBullies,
  getSchoolsBullying,
  getDatesHighestBullying,
} = require("../controllers/analyticsController");

/**
 * @route   GET /frequent-bullies
 * @desc    Retrieve a list of users frequently involved in bullying incidents
 * @access  Public
 */
router.get("/frequent-bullies", getFrequentBullies);

/**
 * @route   GET /schools-bullying
 * @desc    Retrieve schools with the highest number of reported bullying incidents
 * @access  Public
 */
router.get("/schools-bullying", getSchoolsBullying);

/**
 * @route   GET /dates-bullying
 * @desc    Retrieve dates with the highest number of reported bullying incidents
 * @access  Public
 */
router.get("/dates-bullying", getDatesHighestBullying);

/**
 * Export the analytics-related route definitions.
 * @module routes/analytics
 */
module.exports = router;
