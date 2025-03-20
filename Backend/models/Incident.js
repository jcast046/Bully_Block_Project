const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
    contentId: {
        type: String,
        required: true,
    },

    incidentId: {
        type: String,
        required: true,
        unique: true, // Ensures incidentId is unique
        index: true,  // Optimizes search performance
    },

    authorId: {
        type: String,
        required: true,
    },

    contentType: {
        type: String,
        enum: ['message', 'post', 'comment'],
        required: true,
    },

    severityLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true,
    },

    status: {
        type: String,
        enum: ['pending review', 'resolved'],
        required: true,
    },

    timestamp: {
        type: Date,
        default: Date.now,
        index: true, // Allows querying incidents by date efficiently
    }

}, { timestamps: true });

// Ensure uniqueness at the database level
IncidentSchema.index({ incidentId: 1 }, { unique: true });

module.exports = mongoose.model('Incident', IncidentSchema);
