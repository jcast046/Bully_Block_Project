const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    user_id: {type: String, required: true},
    role: {type:String, required: true},
    username: {type:String, required: true},
    email: {type:String, required: true}
}, {collection: 'Users'});

module.exports = mongoose.model('Users', UserSchema);