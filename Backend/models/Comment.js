const mongoose = require('mongoose');
const User = require('./User'); // Import the User model
const Post = require('./Post'); // Reference to Post model for comments

/**
 * Mongoose schema for a Comment document.
 * Represents a user's comment on a specific post.
 */
const CommentSchema = new mongoose.Schema({
    /**
     * Unique identifier for the comment.
     * @type {String}
     */
    comment_id: {
        type: String,
        required: true,
        unique: true,  // Ensure comment_id is unique
    },

    /**
     * The textual content of the comment.
     * @type {String}
     */
    content: {
        type: String,
        required: true,
    },

    /**
     * The username or ID of the comment's author.
     * @type {String}
     */
    author: {
        type: String,
        required: true,
    },

    /**
     * The ID of the post to which this comment belongs.
     * @type {String}
     */
    post: {
        type: String,
        required: true,
    },

    /**
     * The date the comment was created.
     * Automatically set to current date if not provided.
     * @type {Date}
     */
    date: {
        type: Date,
        default: Date.now,
    },
}, {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
});

/**
 * Mongoose model for the Comment schema.
 * @module Comment
 */
module.exports = mongoose.model('Comment', CommentSchema);
