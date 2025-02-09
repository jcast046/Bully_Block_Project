const mongoose = require('mongoose');
const Incident = require('../models/Incident');
const User = require('../models/User');
const Message = require('../models/Message');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// Mapping content types to models
const contentModels = {
    Message,
    Post,
    Comment
};

// @route   POST /api/incident
// @desc    Create a new incident
// @access  Private
const createIncident = async (req, res) => {
    const { contentId, contentType, userId, severityLevel, status } = req.body;

    if (!contentId || !contentType || !userId || !severityLevel || !status) {
        return res.status(400).json({ error: "contentId, contentType, userId, severityLevel, and status are required" });
    }

    if (!["Message", "Post", "Comment"].includes(contentType)) {
        return res.status(400).json({ error: "Invalid contentType. Must be 'Message', 'Post', or 'Comment'." });
    }

    if (!["pending review", "resolved"].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
    }

    try {
        // Ensure contentId exists in the correct collection
        const ContentModel = contentModels[contentType];
        if (!ContentModel) {
            return res.status(400).json({ error: "Invalid contentType" });
        }

        const contentExists = await ContentModel.findById(contentId);
        if (!contentExists) {
            return res.status(404).json({ error: `ContentId not found in ${contentType} collection` });
        }

        // Ensure userId exists in User collection
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ error: "UserId not found in users collection" });
        }

        const newIncident = new Incident({
            contentId,
            contentType,
            userId,
            severityLevel,
            status
        });

        await newIncident.save();
        res.status(201).json(newIncident);

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
        const incidents = await Incident.find()
            .populate({
                path: 'userId',
                select: 'username'
            })
            .lean(); // Convert to plain objects for dynamic population

        // Populate contentId dynamically based on contentType
        await Promise.all(incidents.map(async (incident) => {
            const ContentModel = contentModels[incident.contentType];
            if (ContentModel) {
                incident.content = await ContentModel.findById(incident.contentId).select('content');
            }
        }));

        res.json(incidents);
    } catch (err) {
        console.error("Error fetching incidents:", err);
        res.status(500).json({ error: 'Server error' });
    }
};

// @route   GET /api/incidents/:id
// @desc    Get a single incident by ID
// @access  Public
const getIncident = async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id)
            .populate({
                path: 'userId',
                select: 'username'
            })
            .lean();

        if (!incident) {
            return res.status(404).json({ message: 'Incident not found' });
        }

        // Populate contentId dynamically based on contentType
        const ContentModel = contentModels[incident.contentType];
        if (ContentModel) {
            incident.content = await ContentModel.findById(incident.contentId).select('content');
        }

        res.json(incident);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// @route   PUT /api/incidents/:id
// @desc    Update an incident
// @access  Private
const updateIncident = async (req, res) => {
    try {
        const { status } = req.body;
        if (status && !["pending", "resolved", "dismissed"].includes(status)) {
            return res.status(400).json({ error: "Invalid status value" });
        }

        const incident = await Incident.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
        .populate({
            path: 'userId',
            select: 'username'
        })
        .lean();

        if (!incident) {
            return res.status(404).json({ message: 'Incident not found' });
        }

        // Populate contentId dynamically based on contentType
        const ContentModel = contentModels[incident.contentType];
        if (ContentModel) {
            incident.content = await ContentModel.findById(incident.contentId).select('content');
        }

        res.json(incident);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// @route   DELETE /api/incidents/:id
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
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { createIncident, getAllIncidents, getIncident, updateIncident, deleteIncident };
