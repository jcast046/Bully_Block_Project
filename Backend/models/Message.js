const mongoose = require('mongoose');
const User = require('./User'); // Import the User model

/**
 * Mongoose schema for private messages exchanged between users.
 * Each document represents a single message from one user to another.
 */
const MessageSchema = new mongoose.Schema({
    /**
     * Unique identifier for the message.
     * Used to distinguish messages reliably.
     * @type {String}
     */
    message_id: {
        type: String,
        required: true,
        unique: true,  // Ensure message_id is unique
    },

    /**
     * The textual content of the message.
     * @type {String}
     */
    content: {
        type: String,
        required: true,
    },

    /**
     * Reference to the user who authored the message.
     * @type {mongoose.Schema.Types.ObjectId}
     * @ref User
     */
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    /**
     * Reference to the user who is the recipient of the message.
     * @type {mongoose.Schema.Types.ObjectId}
     * @ref User
     */
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    /**
     * The date and time when the message was sent.
     * Defaults to the current timestamp.
     * @type {Date}
     */
    date: {
        type: Date,
        default: Date.now,
    },
}, {
    /**
     * Adds createdAt and updatedAt fields to track message lifecycle.
     */
    timestamps: true,
});

/**
 * Mongoose model for the Message schema.
 * @module Message
 */
module.exports = mongoose.model('Message', MessageSchema);
