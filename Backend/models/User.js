const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    user_id: { type: String, required: true, index: true, unique: true },
    role: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { 
        type: String, 
        required: true,
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid e-mail address']
    },
    password: { type: String, required: true },

    // Track the number of incidents the user has been involved in
    incidentCount: { type: Number, default: 0 },

    // Track the number of posts, messages, or comments the user has made
    postCount: { type: Number, default: 0 },

    // Add referencedID field to reference another document (e.g., an organization or another user)
    referencedID: { type: mongoose.Schema.Types.ObjectId, ref: 'SomeCollection' }, // Change 'SomeCollection' to your actual collection name

}, { collection: 'Users', timestamps: true });

module.exports = mongoose.model('Users', UserSchema);
