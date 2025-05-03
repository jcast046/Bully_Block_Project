const mongoose = require('mongoose');
const User = require('./User'); // Import the User model

/**
 * Mongoose schema for generic content items created by users.
 * Can represent a post, message, or comment.
 */
const ContentSchema = new mongoose.Schema({
    /**
     * The type of content (post, message, or comment).
     * @type {String}
     * @enum {'post' | 'message' | 'comment'}
     */
    contentType: {
        type: String,
        enum: ['post', 'message', 'comment'],
        required: true,
    },

    /**
     * The main textual content.
     * @type {String}
     */
    content: {
        type: String,
        required: true,
    },

    /**
     * Reference to the User who authored the content.
     * @type {mongoose.Schema.Types.ObjectId}
     * @ref User
     */
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    /**
     * Date the content was created.
     * Defaults to the current date.
     * @type {Date}
     */
    date: {
        type: Date,
        default: Date.now,
    },
}, {
    // Adds createdAt and updatedAt timestamps
    timestamps: true,
});

/**
 * Post-save middleware to increment the author's post count.
 * This runs automatically after a Content document is saved.
 */
ContentSchema.post('save', async function () {
    try {
        const user = await User.findById(this.author);
        if (user) {
            user.postCount += 1;
            await user.save();
        }
    } catch (err) {
        console.error('Error updating post count for user:', err);
    }
});

/**
 * Mongoose model for the Content schema.
 * @module Content
 */
module.exports = mongoose.model('Content', ContentSchema);
