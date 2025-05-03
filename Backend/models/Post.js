// /models/Post.js
const mongoose = require('mongoose');
const User = require('./User'); // Import the User model

/**
 * Mongoose schema for user-generated posts.
 * Represents content shared by users, such as text posts.
 */
const PostSchema = new mongoose.Schema({
    /**
     * Unique identifier for the post.
     * Used to distinguish posts across the system.
     * @type {String}
     */
    post_id: {
        type: String,
        required: true,
        unique: true,  // Ensure unique post_ids
    },

    /**
     * The textual content of the post.
     * @type {String}
     */
    content: {
        type: String,
        required: true,
    },

    /**
     * Identifier (e.g., username or user ID) of the user who created the post.
     * @type {String}
     */
    author: {
        type: String,
        required: true,
    },

    /**
     * The date and time when the post was created.
     * Defaults to the current timestamp.
     * @type {Date}
     */
    date: {
        type: Date,
        default: Date.now,
    },
}, {
    /**
     * Automatically adds `createdAt` and `updatedAt` fields.
     */
    timestamps: true,
});

/**
 * Mongoose model for the Post schema.
 * @module Post
 */
module.exports = mongoose.model('Post', PostSchema);
