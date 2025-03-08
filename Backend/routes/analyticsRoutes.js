const express = require("express");
const router = express.Router();
const {
  getFrequentBullies,
  getSchoolsBullying,
  getDatesHighestBullying,
} = require("../controllers/analyticsController");

// Get frequent bullies
router.get("/frequent-bullies", getFrequentBullies);

// Get schools with most bullying
router.get("/schools-bullying", getSchoolsBullying);

// Get dates with highest bullying rates
router.get("/dates-bullying", getDatesHighestBullying);

module.exports = router;
