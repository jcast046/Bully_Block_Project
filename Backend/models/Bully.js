const mongoose = require('mongoose');
const User = require('./User'); // Import the User model

// Define the schema for reported bullying incidents
const BullySchema = new mongoose.Schema({
    // Description of the bullying incident
    description: {
        type: String,
        required: true, // Description is mandatory
    },

    // Reference to the user who reported the incident
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId, // Links to a User document
        ref: 'User',
        required: true, // The reporting user is mandatory
    },

    // Date the incident was reported
    date: {
        type: Date,
        default: Date.now, // Automatically set to the current date if not provided
    },

    // Type of content associated with the bullying incident
    contentType: {
        type: String,
        enum: ['post', 'message', 'comment'], // Must be one of the specified values
        required: true, // Content type is mandatory
    },

    // Severity level of the bullying incident
    severityLevel: {
        type: String,
        enum: ['low', 'medium', 'high'], // Specifies the severity
        required: true, // Severity level is mandatory
    },

    // Current status of the incident
    status: {
        type: String,
        enum: ['pending', 'resolved', 'ignored'], // Tracks the resolution status
        default: 'pending', // Default status is 'pending'
    },

    // Reference to the flagged content (e.g., post, message, or comment)
    contentId: {
        type: mongoose.Schema.Types.ObjectId, // Links to a Content document
        ref: 'Content',
        required: true, // Content reference is mandatory
    },

    // Reference to any generated alert for this incident
    alert: {
        type: mongoose.Schema.Types.ObjectId, // Links to an Alert document
        ref: 'Alert',
    },
}, {
    // Automatically add createdAt and updatedAt fields to the schema
    timestamps: true,
});

// Middleware executed after an incident is saved
BullySchema.post('save', async function () {
    try {
        // Find the user who reported the incident
        const user = await User.findById(this.reportedBy);
        if (user) {
            // Increment the user's incident count
            user.incidentCount += 1;
            await user.save(); // Save the updated user data
        }
    } catch (err) {
        // Log any error encountered during the update
        console.error('Error updating incident count for user:', err);
    }
});

// Export the Bully model, allowing it to be used in other parts of the application
module.exports = mongoose.model('Bully', BullySchema);
