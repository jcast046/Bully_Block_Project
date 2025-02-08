const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content',
        required: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
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

module.exports = mongoose.model('Incident', IncidentSchema);