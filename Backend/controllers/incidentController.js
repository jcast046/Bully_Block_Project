const Incident = require('../models/Incident');
const Content = require('../models/Content');
const User = require('../models/User');

// @route   POST /api/incident
// @desc    Create a new incidnet
// @access  Private 
const createIncident = async (req, res) => {
    const { contentId, userId, severityLevel, status } = req.body;

    if (!contentId || !userId || !severityLevel || !status) {
        return res.status(400).json({ error: "contentId, userId, severityLevel, and status are required" });
    }

    try {
        const newIncident = new Incident({
            contentId, userId, severityLevel, status,
        });

        // ContentId must exist in Content collection
        const contentExists = await Content.findById(contentId);
        if (!contentExists){
            return res.status(404).json({ error: "ContentId not found in content collection" });
        }

        // UserId must exist in users collection
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ error: "UserId not found in users collection" });
        }

        await newIncident.save();
        res.status(201).json(newIncident)

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

// @route   GET /api/incidents
// @desc    Get all incidents
// @access  Public
const getAllIncidents = async (req, res) => {
    try {
        const incident = await Incident.find()
            // get the actual content that was flagged
            .populate({
            path: 'contentId',
            select: 'content'
            })

            // get the username of the offender
            .populate({
                path: 'userId',
                select: 'username'
            });
        res.json(incident);
    } catch (err) {
        console.error("Error fetching incidents:", err);
        res.status(500).json({ error: 'Server error' });
    }
};

// @route   GET /api/incidents/:id
// @desc    Get a single incidnet by ID
// @access  Public
const getIncident = async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id)
            .populate({
                path: 'contentId',
                select: 'content'
            })
            .populate({
                path: 'userId',
                select: 'username'
            });
        if (!incident) {
            return res.status(404).json({ message: 'Incident not found' });
        }
        res.json(incident)
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// @route   PUT /api/incidnet/:id
// @desc    Update an incident
// @access  Private 
const updateIncident = async (req, res) => {
    try {
        const incident = await Incident.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
        .populate({
            path: 'contentId',
            select: 'content' 
        })
        .populate({
            path: 'userId',
            select: 'username'
        });

        if (!incident) {
            return res.status(404).json({ message: 'Incident not found' });
        }

        res.json(incident);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// @route   DELETE /api/incident/:id
// @desc    Delete an incident
// @access  Private 
const deleteIncident = async (req, res) => {
    try {
        const incident = await Incident.findByIdAndDelete(req.params.id);

        if (!incident) {
            return res.status(404).json({ message: 'Incident not found' });
        }

        res.json({ message: 'Incident successfully deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
module.exports = { createIncident, getAllIncidents, getIncident, updateIncident, deleteIncident};



