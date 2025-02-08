const mongoose = require('mongoose');
const User = require('./User'); // Import the User model

const MessageSchema = new mongoose.Schema({
    message_id: {
        type: String,
        required: true,
        unique: true,  // Ensure message_id is unique
    },
    content: {
        type: String,
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Message', MessageSchema);
