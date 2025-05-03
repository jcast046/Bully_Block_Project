/**
 * @file Bully.js
 * @description Mongoose schema and model for reported bullying incidents, including metadata such as reporter, severity, and related content.
 */

const mongoose = require('mongoose');
const User = require('./User'); // Import the User model

/**
 * Mongoose schema for storing reported bullying incidents.
 * 
 * @typedef {Object} Bully
 * @property {string} description - Description of the bullying incident.
 * @property {mongoose.Types.ObjectId} reportedBy - Reference to the User who reported the incident.
 * @property {Date} date - Date the incident was reported. Defaults to current date.
 * @property {'post'|'message'|'comment'} contentType - Type of content associated with the incident.
 * @property {'low'|'medium'|'high'} severityLevel - Severity level of the bullying.
 * @property {'pending'|'resolved'|'ignored'} status - Current status of the incident.
 * @property {mongoose.Types.ObjectId} contentId - Reference to the flagged content document.
 * @property {mongoose.Types.ObjectId} [alert] - Optional reference to a related alert.
 */
const BullySchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    contentType: {
        type: String,
        enum: ['post', 'message', 'comment'],
        required: true,
    },
    severityLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'ignored'],
        default: 'pending',
    },
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content',
        required: true,
    },
    alert: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Alert',
    },
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
});

/**
 * Post-save middleware that increments the reporting user's incident count after a bullying report is created.
 * 
 * @function
 * @name BullySchema.post('save')
 */
BullySchema.post('save', async function () {
    try {
        const user = await User.findById(this.reportedBy);
        if (user) {
            user.incidentCount += 1;
            await user.save();
        }
    } catch (err) {
        console.error('Error updating incident count for user:', err);
    }
});

/**
 * Mongoose model for the Bully schema.
 * @type {mongoose.Model<Bully>}
 */
module.exports = mongoose.model('Bully', BullySchema);
