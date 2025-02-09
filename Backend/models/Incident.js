const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'contentType' // Dynamically reference collection
    },

    contentType: {
        type: String,
        enum: ['Message', 'Post', 'Comment'], // Define possible collections
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

module.exports = mongoose.model('Incidents', IncidentSchema);