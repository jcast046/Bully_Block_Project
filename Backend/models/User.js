onst mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    user_id: { type: String, required: true, index: true },  // Added index for better performance
    role: { type: String, required: true },
    username: { type: String, required: true, unique: true },  // Ensures unique username
    email: { 
        type: String, 
        required: true, 
        unique: true,  // Ensures unique email
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']  // Email format validation
    },

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
}, { collection: 'Users', timestamps: true });  // Added timestamps for createdAt and updatedAt

module.exports = mongoose.model('Users', UserSchema);
