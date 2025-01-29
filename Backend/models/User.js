const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    role: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true },

    // Track the number of incidents the user has been involved in
    incidentCount: {
        type: Number,
        default: 0,
    },

    // Track the number of posts, messages, or comments the user has made
    postCount: {
        type: Number,
        default: 0,
    },
}, { collection: 'Users' });

module.exports = mongoose.model('Users', UserSchema);
