const mongoose = require('mongoose');

/**
 * Mongoose schema for representing a school.
 * Stores metadata such as the school's ID, name, and location.
 */
const SchoolSchema = new mongoose.Schema({
    /**
     * Unique identifier for the school.
     * @type {String}
     */
    school_id: {
        type: String,
        required: true
    },

    /**
     * Full name of the school.
     * @type {String}
     */
    school_name: {
        type: String,
        required: true
    },

    /**
     * Physical or geographical location of the school.
     * @type {String}
     */
    location: {
        type: String,
        required: true
    }
}, {
    /**
     * Specify the MongoDB collection name explicitly.
     */
    collection: 'Schools'
});

/**
 * Mongoose model for the School schema.
 * @module Schools
 */
module.exports = mongoose.model('Schools', SchoolSchema);
