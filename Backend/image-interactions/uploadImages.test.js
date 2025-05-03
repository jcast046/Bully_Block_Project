/*
 * @file uploadImages.test.js
 * @description Unit tests for the `uploadImages` script using Jest.
 * Tests ensure images are uploaded in a consistent order, errors are handled,
 * and logging is performed correctly.
 *
 * To run:
 *   npm install --save-dev jest
 *   npx jest uploadImages.test.js
 */

const fs = require('fs');
const path = require('path');
const uploadImages = require('../image-interactions/uploadImages');
const ImageModel = require('../models/Image');

// Mocking dependencies for isolated testing
jest.mock('fs');
jest.mock('path');
jest.mock('../models/Image');

describe('uploadImages', () => {
    // Mocked path and predefined image data
    const aiDir = '/mocked/ai_algorithms';
    const mockImages = [
        { filePath: 'entity_distribution.png', imageType: 'entity_distribution' },
        { filePath: 'POS_tag_distribution.png', imageType: 'POS_tag_distribution' },
        { filePath: 'sentiment_scores.png', imageType: 'sentiment_scores' }
    ];

    /**
     * Setup mocks before each test case.
     */
    beforeEach(() => {
        jest.clearAllMocks();

        // Mocking path.join to return a mocked directory
        path.join.mockImplementation((...args) => path.resolve(...args));

        // Default: mock image data being read from file system
        fs.readFileSync.mockImplementation((filePath) => {
            return Buffer.from(`Image data for ${filePath}`);
        });

        // Mock ImageModel.create to resolve successfully
        ImageModel.create.mockResolvedValue();

        // Mock the aiDir to be the mocked path
        aiDir = '/mocked/ai_algorithms';
    });

    /**
     * Test to ensure images are uploaded in the correct order (alphabetically).
     */
    it('should upload images in alphabetical order', async () => {
        await uploadImages();

        // Images should be uploaded in alphabetical order
        expect(ImageModel.create).toHaveBeenCalledWith(expect.objectContaining({
            name: 'POS_tag_distribution.png',
            imageType: 'POS_tag_distribution'
        }));

        expect(ImageModel.create).toHaveBeenCalledWith(expect.objectContaining({
            name: 'entity_distribution.png',
            imageType: 'entity_distribution'
        }));

        expect(ImageModel.create).toHaveBeenCalledWith(expect.objectContaining({
            name: 'sentiment_scores.png',
            imageType: 'sentiment_scores'
        }));
    });

    /**
     * Test to ensure file reading or encoding errors are handled gracefully.
     */
    it('should handle file read or encoding errors gracefully', async () => {
        fs.readFileSync.mockImplementation(() => { throw new Error('File read error'); });

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        await uploadImages();

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error uploading images:'), expect.any(Error));
    });

    /**
     * Test to ensure images are correctly saved with base64 encoding.
     */
    it('should encode images to base64 and upload them to MongoDB', async () => {
        await uploadImages();

        expect(ImageModel.create).toHaveBeenCalledWith(expect.objectContaining({
            img: expect.stringMatching(/^data:image\/png;base64,/),  // Checks for base64 prefix
            imageType: expect.any(String),
        }));
    });

    /**
     * Test to verify that the correct number of images are uploaded.
     */
    it('should upload all images listed', async () => {
        await uploadImages();

        expect(ImageModel.create).toHaveBeenCalledTimes(mockImages.length);
    });

    /**
     * Test to ensure that a summary log message is printed after processing.
     */
    it('should log summary counts', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

        await uploadImages();

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Image upload complete:'));
    });
});
