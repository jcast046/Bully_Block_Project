const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
    school_id: {type: String, required: true},
    school_name: {type: String, required: true},
    location: {type: String, required: true},
}, {collection: 'Schools'});

module.exports = mongoose.model('Schools', SchoolSchema);