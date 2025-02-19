const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    img: {
        type: String,
        required: true
    },

    imageType: {
        type: String,
        enum: ['entity_distribution', 'POS_tag_distribution', 'sentiment_scores', 'other'],
        default: 'other'
    },

    timestamp: {
        type: Date, 
        default: Date.now
    }


});

module.exports = mongoose.model('Image', ImageSchema);