const mongoose = require('mongoose');
const User = require('./User'); // Import the User model
const Post = require('./Post'); // Reference to Post model for comments

const CommentSchema = new mongoose.Schema({
    comment_id: {
        type: String,
        required: true,
        unique: true,  // Ensure comment_id is unique
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
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true, // Each comment belongs to a post
    },
    date: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Comment', CommentSchema);
