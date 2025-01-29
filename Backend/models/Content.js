const mongoose = require('mongoose');
const User = require('./User'); // Import the User model

const ContentSchema = new mongoose.Schema({
    contentType: {
        type: String,
        enum: ['post', 'message', 'comment'],
        required: true,
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
    date: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Middleware to increment the post count for the user
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

module.exports = mongoose.model('Content', ContentSchema);
