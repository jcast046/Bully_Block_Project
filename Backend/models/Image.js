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
        enum: [
            'entity_distribution', 
            'POS_tag_distribution', 
            'sentiment_scores',
            'PyTorch_LSTM_Loss',
            'overall_accuracy',
            'Tensorflow_Overall_Accuracy',
            'PyTorch_CNN_Loss',
            'severity_levels'
        ]
    },

    timestamp: {
        type: Date, 
        default: Date.now
    }


});

module.exports = mongoose.model('Image', ImageSchema);