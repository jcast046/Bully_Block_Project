const Bully = require('../models/Bully');
const authMiddleware = require('../middleware/authMiddleware'); // Import authentication

const getBullyReports = async (req, res) => {
  try {
    const reports = await Bully.find();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const addBullyReport = async (req, res) => {
  const { description, reportedBy } = req.body;

  if (!description || !reportedBy) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const report = new Bully({ description, reportedBy });
    await report.save();
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Apply authentication middleware to routes
module.exports = {
  getBullyReports: [authMiddleware, getBullyReports],
  addBullyReport: [authMiddleware, addBullyReport],
};
