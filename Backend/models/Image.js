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
        enum: ['entity_distribution', 
            'POS_tag_distribution', 
            'sentiment_scores',
            'PyTorch_LSTM_Loss',
            'overall_accuracy']
    },

    timestamp: {
        type: Date, 
        default: Date.now
    }


});

module.exports = mongoose.model('Image', ImageSchema);