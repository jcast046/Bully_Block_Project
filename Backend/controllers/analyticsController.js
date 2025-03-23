const Incident = require("../models/Incident");
const User = require("../models/User");

// Get frequent bullies (users with most incidents)
const getFrequentBullies = async (req, res) => {
  try {
    const incidents = await Incident.find();

    // Aggregate incidents by username or author_id
    const bullyCounts = {};
    incidents.forEach((incident) => {
      const userKey = incident.username || incident.author_id;
      // Skip if no valid user identifier is found
      if (!userKey) return;

      if (!bullyCounts[userKey]) {
        bullyCounts[userKey] = { name: userKey, incidents: 0 };
      }
      bullyCounts[userKey].incidents += 1;
    });

    // Filter users with 10 or more incidents and sort from most to least
    const bullies = Object.values(bullyCounts)
      .filter((bully) => bully.incidents >= 10)
      .sort((a, b) => b.incidents - a.incidents)
      .slice(0, 10); // Limit to top 10

    // If no bullies found, return default data
    if (bullies.length === 0) {
      return res.json([{ name: "No incidents reported", incidents: 0 }]);
    }

    res.json(bullies);
  } catch (err) {
    console.error("Error getting frequent bullies:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get schools with most bullying incidents
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
      {
        $unwind: "$user",
      },
      {
        $group: {
          _id: "$user.referencedID", // referencedID contains the school ID
          incidents: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "Schools", // Assuming you have a Schools collection
          localField: "_id",
          foreignField: "_id",
          as: "schoolInfo",
        },
      },
      {
        $unwind: "$schoolInfo",
      },
      {
        $project: {
          school: "$schoolInfo.name",
          incidents: 1,
          _id: 0,
        },
      },
      {
        $sort: { incidents: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // If no schools found, return default data
    if (schools.length === 0) {
      return res.json([{ school: "No incidents reported", incidents: 0 }]);
    }

    res.json(schools);
  } catch (err) {
    console.error("Error getting schools bullying:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get dates with highest bullying rates
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
      {
        $sort: { incidents: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // If no dates found, return default data with today's date
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
