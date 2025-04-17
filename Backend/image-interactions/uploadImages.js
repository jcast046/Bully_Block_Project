/**
 * @file uploadImages.js
 * @description Script to upload static analysis images to MongoDB, always uploading in the same order.
 */

const fs = require('fs');
const path = require('path');
const ImageModel = require('../models/Image');

/**
 * Predefined image upload list with associated imageTypes.
 * @type {Array<{ filePath: string, imageType: string }>}.
 * Sorting by `imageType` (or `filePath`) to ensure order remains consistent.
 */
const imageList = [
    { filePath: 'entity_distribution.png', imageType: 'entity_distribution' },
    { filePath: 'POS_tag_distribution.png', imageType: 'POS_tag_distribution' },
    { filePath: 'sentiment_scores.png', imageType: 'sentiment_scores' },
    { filePath: 'PyTorchLSTMLoss.png', imageType: 'PyTorch_LSTM_Loss' },
    { filePath: 'PyTorchOverallAccuracy.png', imageType: 'overall_accuracy' },
    { filePath: 'TensorflowOverallAccuracy.png', imageType: 'Tensorflow_Overall_Accuracy' },
    { filePath: 'PyTorchCNNLoss.png', imageType: 'PyTorch_CNN_Loss' },
    { filePath: 'severity_levels.png', imageType: 'severity_levels' }
];

/**
 * @async
 * @function uploadImages
 * @description Uploads analysis images to MongoDB in the exact same order every time.
 * @returns {Promise<void>} Resolves once all images are uploaded.
 */
async function uploadImages() {
    try {
        console.log("Starting image upload...");

        const aiDir = path.join(__dirname,'..', '..', 'ai_algorithms');
        let uploadedCount = 0;

        // Sorting the images by file name to enforce consistent order
        const sortedImageList = imageList.sort((a, b) => {
            return a.filePath.localeCompare(b.filePath);  // Sort by file name
        });

        for (const { filePath, imageType } of sortedImageList) {
            const fullPath = path.join(aiDir, filePath);
            const imageName = path.basename(fullPath);

            // Read and encode image
            const imageBuffer = fs.readFileSync(fullPath);
            const base64Image = imageBuffer.toString('base64');
            const mimeType = 'image/png';

            await ImageModel.create({
                name: imageName,
                img: `data:${mimeType};base64,${base64Image}`,
                imageType
            });

            uploadedCount++;
        }

        console.log(`Image upload complete: ${uploadedCount} images uploaded to MongoDB.`);
    } catch (err) {
        console.error('Error uploading images:', err);
    }
}

module.exports = uploadImages;
