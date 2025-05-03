const mongoose = require('mongoose');

/**
 * Mongoose schema for storing image metadata and paths.
 * Represents visual outputs such as analytics charts or model metrics.
 */
const ImageSchema = new mongoose.Schema({
    /**
     * The name or title of the image.
     * @type {String}
     */
    name: {
        type: String,
        required: true
    },

    /**
     * The file path or URL to the image.
     * @type {String}
     */
    img: {
        type: String,
        required: true
    },

    /**
     * The type/category of the image, used for distinguishing visualizations.
     * @type {String}
     * @enum {'entity_distribution' | 'POS_tag_distribution' | 'sentiment_scores' | 
     *        'PyTorch_LSTM_Loss' | 'overall_accuracy' | 'Tensorflow_Overall_Accuracy' |
     *        'PyTorch_CNN_Loss' | 'severity_levels'}
     */
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

    /**
     * The date and time the image record was created.
     * Defaults to the current timestamp.
     * @type {Date}
     */
    timestamp: {
        type: Date, 
        default: Date.now
    }
});

/**
 * Mongoose model for the Image schema.
 * @module Image
 */
module.exports = mongoose.model('Image', ImageSchema);
