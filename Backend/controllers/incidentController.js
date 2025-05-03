const Incident = require('../models/Incident');
const mongoose = require('mongoose');

/**
 * Creates a new incident in the database.
 *
 * @route POST /api/incidents
 * @access Private
 * @param {Object} req - Express request object containing incident details in the body.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response with the created incident or an error.
 */
const createIncident = async (req, res) => {
    const { incidentId, contentId, contentType, severityLevel, status, authorId } = req.body;

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

/**
 * Retrieves all incidents with author usernames included.
 *
 * @route GET /api/incidents
 * @access Public
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object[]} JSON array of incident objects.
 */
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

/**
 * Retrieves a single incident by its ID, including its content and author's username.
 *
 * @route GET /api/incidents/:id
 * @access Public
 * @param {Object} req - Express request object containing the incident ID in `params`.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON object of the incident or error.
 */
const getIncident = async (req, res) => {
    try {
        const incident = await Incident.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
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

/**
 * Returns the total number of incidents in the database.
 *
 * @route GET /api/incidents/count
 * @access Public
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON object with total incident count.
 */
const getIncidentCount = async (req, res) => {
    try {
        const count = await Incident.countDocuments();
        res.json({ count });
    } catch (error) {
        console.error("Error fetching incident count:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
};

/**
 * Updates an incident's fields by ID. Only status is updatable.
 *
 * @route PUT /api/incidents/:id
 * @access Private
 * @param {Object} req - Express request object with updated fields in the body.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON object of the updated incident or an error.
 */
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

/**
 * Deletes an incident by its ID.
 *
 * @route DELETE /api/incidents/:id
 * @access Private
 * @param {Object} req - Express request object containing the incident ID in `params`.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON message confirming deletion or an error.
 */
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

module.exports = {
    createIncident,
    getAllIncidents,
    getIncident,
    updateIncident,
    deleteIncident,
    getIncidentCount
};
