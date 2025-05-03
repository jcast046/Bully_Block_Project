/**
 * @fileoverview Contains analytics functions for identifying bullying trends,
 * such as frequent bullies, schools with the most incidents, and peak bullying dates.
 */

const Incident = require("../models/Incident");
const User = require("../models/User");

/**
 * Retrieves the top 10 users with the highest number of bullying incidents.
 * Considers users with 10 or more incidents as frequent bullies.
 *
 * @function getFrequentBullies
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Responds with a list of users and their incident counts.
 */
const getFrequentBullies = async (req, res) => {
  try {
    const incidents = await Incident.find();

    // Aggregate incidents by username or author_id
    const bullyCounts = {};
    incidents.forEach((incident) => {
      const userKey = incident.username || incident.author_id;
      if (!userKey) return;

      if (!bullyCounts[userKey]) {
        bullyCounts[userKey] = { name: userKey, incidents: 0 };
      }
      bullyCounts[userKey].incidents += 1;
    });

    // Filter users with 10+ incidents and sort by count
    const bullies = Object.values(bullyCounts)
      .filter((bully) => bully.incidents >= 10)
      .sort((a, b) => b.incidents - a.incidents)
      .slice(0, 10);

    if (bullies.length === 0) {
      return res.json([{ name: "No incidents reported", incidents: 0 }]);
    }

    res.json(bullies);
  } catch (err) {
    console.error("Error getting frequent bullies:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Retrieves the top 10 schools with the highest number of bullying incidents.
 * Uses the `referencedID` field in the User model to associate incidents with schools.
 *
 * @function getSchoolsBullying
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Responds with a list of schools and their incident counts.
 */
const getSchoolsBullying = async (req, res) => {
  try {
    const schools = await Incident.aggregate([
      {
        $lookup: {
          from: "Users",
          localField: "authorId",
          foreignField: "user_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $group: {
          _id: "$user.referencedID",
          incidents: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "Schools",
          localField: "_id",
          foreignField: "_id",
          as: "schoolInfo",
        },
      },
      { $unwind: "$schoolInfo" },
      {
        $project: {
          school: "$schoolInfo.name",
          incidents: 1,
          _id: 0,
        },
      },
      { $sort: { incidents: -1 } },
      { $limit: 10 },
    ]);

    if (schools.length === 0) {
      return res.json([{ school: "No incidents reported", incidents: 0 }]);
    }

    res.json(schools);
  } catch (err) {
    console.error("Error getting schools bullying:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Retrieves the top 10 dates with the highest number of bullying incidents.
 *
 * @function getDatesHighestBullying
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Responds with a list of dates and corresponding incident counts.
 */
const getDatesHighestBullying = async (req, res) => {
  try {
    const dates = await Incident.aggregate([
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamp",
            },
          },
          incidents: { $sum: 1 },
        },
      },
      {
        $project: {
          date: "$_id",
          incidents: 1,
          _id: 0,
        },
      },
      { $sort: { incidents: -1 } },
      { $limit: 10 },
    ]);

    if (dates.length === 0) {
      return res.json([
        { date: new Date().toISOString().split("T")[0], incidents: 0 },
      ]);
    }

    res.json(dates);
  } catch (err) {
    console.error("Error getting dates with highest bullying:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getFrequentBullies,
  getSchoolsBullying,
  getDatesHighestBullying,
};
