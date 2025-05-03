const mongoose = require('mongoose');

/**
 * Mongoose schema for user accounts.
 * Captures core identity, role, and activity metrics for each user.
 */
const UserSchema = new mongoose.Schema({
    /**
     * Unique user identifier.
     * Indexed for fast lookups.
     * @type {String}
     */
    user_id: { 
        type: String, 
        required: true, 
        index: true, 
        unique: true 
    },

    /**
     * Role of the user within the system (e.g., 'admin', 'moderator', 'user').
     * @type {String}
     */
    role: { 
        type: String, 
        required: true 
    },

    /**
     * Unique username chosen by the user.
     * @type {String}
     */
    username: { 
        type: String, 
        required: true, 
        unique: true 
    },

    /**
     * Optional email address of the user.
     * Must match a valid email format if provided.
     * @type {String}
     */
    email: { 
        type: String, 
        required: false,
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid e-mail address']
    },

    /**
     * Optional hashed password for authentication.
     * @type {String}
     */
    password: { 
        type: String, 
        required: false 
    },

    /**
     * Number of incidents the user has been involved in (e.g., flagged content).
     * Defaults to 0.
     * @type {Number}
     */
    incidentCount: { 
        type: Number, 
        default: 0 
    },

    /**
     * Number of posts, messages, or comments authored by the user.
     * Defaults to 0.
     * @type {Number}
     */
    postCount: { 
        type: Number, 
        default: 0 
    },

    /**
     * Reference to another collection (e.g., a school, department, or team).
     * @type {mongoose.Schema.Types.ObjectId}
     * @ref SomeCollection
     */
    referencedID: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'SomeCollection' 
    }
}, { 
    /**
     * Store users in the 'Users' collection and track creation/update timestamps.
     */
    collection: 'Users', 
    timestamps: true 
});

/**
 * Mongoose model for the User schema.
 * @module Users
 */
module.exports = mongoose.model('Users', UserSchema);
