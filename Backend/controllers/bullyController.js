/**
 * @fileoverview Controller for managing bully reports.
 * Includes functions to retrieve all reports and add new ones.
 * Authentication middleware is applied to all routes.
 */

const Bully = require('../models/Bully');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Retrieves all bully reports from the database.
 *
 * @function getBullyReports
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Responds with an array of bully report objects.
 */
const getBullyReports = async (req, res) => {
  try {
    const reports = await Bully.find();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Adds a new bully report to the database.
 *
 * @function addBullyReport
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} req.body - The request payload containing report details.
 * @param {string} req.body.description - Description of the bullying incident.
 * @param {string} req.body.reportedBy - Identifier of the reporter.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Responds with the newly created report or an error message.
 */
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

/**
 * Exports the route handlers with authentication middleware applied.
 *
 * @module BullyController
 */
module.exports = {
  getBullyReports: [authMiddleware, getBullyReports],
  addBullyReport: [authMiddleware, addBullyReport],
};
