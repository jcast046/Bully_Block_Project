const mongoose = require('mongoose');

/**
 * Mongoose schema for tracking flagged or notable content incidents.
 * Used to log messages, posts, or comments that require moderation or review.
 */
const IncidentSchema = new mongoose.Schema({
    /**
     * The ID of the associated content (message, post, or comment).
     * @type {String}
     */
    contentId: {
        type: String,
        required: true,
    },

    /**
     * Unique identifier for the incident.
     * Used to distinguish and retrieve incidents efficiently.
     * @type {String}
     */
    incidentId: {
        type: String,
        required: true,
        unique: true, // Ensures incidentId is unique
        index: true,  // Optimizes search performance
    },

    /**
     * ID of the user who authored the flagged content.
     * @type {String}
     */
    authorId: {
        type: String,
        required: true,
    },

    /**
     * The type of content associated with the incident.
     * Can be a message, post, or comment.
     * @type {String}
     * @enum {'message' | 'post' | 'comment'}
     */
    contentType: {
        type: String,
        enum: ['message', 'post', 'comment'],
        required: true,
    },

    /**
     * The actual content that triggered the incident report.
     * Optional field.
     * @type {String}
     */
    content: { 
        type: String, 
        required: false 
    },

    /**
     * Severity level assigned to the incident.
     * Indicates the criticality of the content.
     * @type {String}
     * @enum {'zero' | 'low' | 'high'}
     */
    severityLevel: {
        type: String,
        enum: ['zero', 'low', 'high'],
        required: true,
    },

    /**
     * Current status of the incident.
     * Used to track whether the incident is still under review or resolved.
     * @type {String}
     * @enum {'pending review' | 'resolved'}
     */
    status: {
        type: String,
        enum: ['pending review', 'resolved'],
        required: true,
    },

    /**
     * Timestamp indicating when the incident was created.
     * Defaults to the current date and time.
     * Indexed for efficient time-based queries.
     * @type {Date}
     */
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    }

}, { 
    // Automatically adds createdAt and updatedAt fields
    timestamps: true 
});

/**
 * Enforce uniqueness for incidentId at the database level.
 */
IncidentSchema.index({ incidentId: 1 }, { unique: true });

/**
 * Mongoose model for the Incident schema.
 * @module Incident
 */
module.exports = mongoose.model('Incident', IncidentSchema);
