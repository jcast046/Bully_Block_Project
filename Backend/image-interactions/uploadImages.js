/**
 * @file uploadImages.js
 * @description Script to upload static analysis images to MongoDB, always uploading in the same order.
 */

const fs = require('fs');
const path = require('path');
const ImageModel = require('../models/Image');

/**
 * Predefined list of image files and their corresponding types.
 * These are uploaded in a consistent order for reproducibility.
 * 
 * @type {Array<{ filePath: string, imageType: string }>}
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
 * Uploads analysis images to MongoDB in a consistent order.
 *
 * Steps:
 * 1. Sorts the image list by filename to ensure deterministic order.
 * 2. Reads each image from disk and encodes it in base64.
 * 3. Stores each image with metadata in MongoDB using the ImageModel.
 *
 * @async
 * @function uploadImages
 * @returns {Promise<void>} A promise that resolves when all images have been uploaded.
 */
async function uploadImages() {
    try {
        console.log("Starting image upload...");

        // Define the path to the AI-generated images directory
        const aiDir = path.join(__dirname, '..', '..', 'ai_algorithms');
        let uploadedCount = 0;

        // Sort images alphabetically by file path to ensure consistent upload order
        const sortedImageList = imageList.sort((a, b) => {
            return a.filePath.localeCompare(b.filePath);
        });

        for (const { filePath, imageType } of sortedImageList) {
            const fullPath = path.join(aiDir, filePath);
            const imageName = path.basename(fullPath);

            // Read image file into buffer
            const imageBuffer = fs.readFileSync(fullPath);

            // Encode image to base64
            const base64Image = imageBuffer.toString('base64');
            const mimeType = 'image/png';

            // Save to MongoDB
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
