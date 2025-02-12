const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
    contentId: {
        type: String,
        required: true,
    },

    incidentId: {
        type: String,
        required: true
    },

    authorId: {
        type: String,
        required: true
    },

    contentType: {
        type: String,
        enum: ['message', 'post', 'comment'],
        required: true
    },

    severityLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true
    },

    status: {
        type: String,
        enum: ['pending review', 'resolved'],
        required: true
    },

    timestamp: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model('Incidents', IncidentSchema);