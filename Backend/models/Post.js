// /models/Post.js
const mongoose = require('mongoose');
const User = require('./User'); // Import the User model

const PostSchema = new mongoose.Schema({
    post_id: {
        type: String,
        required: true,
        unique: true,  // Ensure unique post_ids
    },
    content: {
        type: String,
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference the User model
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true, // Automatically add createdAt and updatedAt fields
});

module.exports = mongoose.model('Post', PostSchema);
