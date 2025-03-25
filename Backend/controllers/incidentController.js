const Incident = require('../models/Incident');
const mongoose = require('mongoose');

// @route   POST /api/incidents
// @desc    Create a new incident
// @access  Private
const createIncident = async (req, res) => {
    const { incidentId, contentId, contentType, severityLevel, status, authorId } = req.body;

    // Input validation
    if (!incidentId || !contentId || !contentType || !severityLevel || !status || !authorId) {
        return res.status(400).json({ error: "All fields (incidentId, contentId, contentType, severityLevel, status, and authorId) are required." });
    }

    if (!["message", "post", "comment"].includes(contentType.toLowerCase())) {
        return res.status(400).json({ error: "Invalid contentType. Must be 'message', 'post', or 'comment'." });
    }

    if (!["low", "medium", "high"].includes(severityLevel.toLowerCase())) {
        return res.status(400).json({ error: "Invalid severityLevel. Must be 'low', 'medium', or 'high'." });
    }

    if (!["pending review", "resolved"].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
    }

    try {
        // Check if the incident already exists
        const existingIncident = await Incident.findOne({ incidentId });
        if (existingIncident) {
            return res.status(400).json({ error: "Incident with this incidentId already exists." });
        }

        const newIncident = new Incident({
            incidentId,
            contentId,
            contentType,
            severityLevel,
            status,
            authorId
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
        const incidents = await Incident.aggregate([
            {
                $lookup: {
                    from: "Users",
                    localField: "authorId",
                    foreignField: "user_id",
                    as: "author"
                }
            },
            {
                $addFields: {
                    username: { $arrayElemAt: ["$author.username", 0] }
                }
            },
            {
                $project: {
                    author: 0
                }
            }
        ]);

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
        const incident = await Incident.aggregate([
            // Match the specific incident by ID
            {
                $match: { _id: new mongoose.Types.ObjectId(req.params.id) }
            },

            // Lookup user info
            {
                $lookup: {
                    from: "Users",
                    localField: "authorId",
                    foreignField: "user_id",
                    as: "author"
                }
            },
            {
                $addFields: {
                    username: { $arrayElemAt: ["$author.username", 0] }
                }
            },

            // Lookup content from the Posts collection
            {
                $lookup: {
                    from: "posts",
                    let: { contentId: "$contentId", type: "$contentType" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$$type", "post"] },
                                        { $eq: ["$post_id", "$$contentId"] }
                                    ]
                                }
                            }
                        },
                        { $project: { content: 1, _id: 0 } }
                    ],
                    as: "postContent"
                }
            },

            // Lookup content from the Messages collection
            {
                $lookup: {
                    from: "messages",
                    let: { contentId: "$contentId", type: "$contentType" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$$type", "message"] },
                                        { $eq: ["$message_id", "$$contentId"] }
                                    ]
                                }
                            }
                        },
                        { $project: { content: 1, _id: 0 } }
                    ],
                    as: "messageContent"
                }
            },

            // Lookup content from the Comments collection
            {
                $lookup: {
                    from: "comments",
                    let: { contentId: "$contentId", type: "$contentType" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$$type", "comment"] },
                                        { $eq: ["$comment_id", "$$contentId"] }
                                    ]
                                }
                            }
                        },
                        { $project: { content: 1, _id: 0 } }
                    ],
                    as: "commentContent"
                }
            },

            // Merge the correct content field based on contentType
            {
                $addFields: {
                    content: {
                        $cond: {
                            if: { $eq: ["$contentType", "post"] },
                            then: { $arrayElemAt: ["$postContent.content", 0] },
                            else: {
                                $cond: {
                                    if: { $eq: ["$contentType", "message"] },
                                    then: { $arrayElemAt: ["$messageContent.content", 0] },
                                    else: { $arrayElemAt: ["$commentContent.content", 0] }
                                }
                            }
                        }
                    }
                }
            },

            // Remove unnecessary fields
            {
                $project: {
                    author: 0,
                    postContent: 0,
                    messageContent: 0,
                    commentContent: 0
                }
            }
        ]);

        if (!incident || incident.length === 0) {
            return res.status(404).json({ message: 'Incident not found' });
        }

        res.json(incident[0]);
    } catch (err) {
        console.error("Error fetching incident:", err);
        res.status(500).json({ error: 'Server error' });
    }
};


// @route   GET /api/incidents/count
// @desc    Get total count of incidents
// @access  Public
const getIncidentCount = async (req, res) => {
    try {
        const count = await Incident.countDocuments();
        res.json({ count });
    } catch (error) {
        console.error("Error fetching incident count:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
};

// @route   PUT /api/incidents/:id
// @desc    Update an incident
// @access  Private
const updateIncident = async (req, res) => {
    try {
        const { status, authorId } = req.body;

        if (status && !["pending review", "resolved"].includes(status)) {
            return res.status(400).json({ error: "Invalid status value" });
        }

        if (authorId) {
            return res.status(400).json({ error: "authorId cannot be updated" });
        }

        const incident = await Incident.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!incident) {
            return res.status(404).json({ message: 'Incident not found' });
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

module.exports = { createIncident, getAllIncidents, getIncident, updateIncident, deleteIncident, getIncidentCount };
