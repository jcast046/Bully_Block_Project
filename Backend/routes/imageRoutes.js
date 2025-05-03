const express = require('express');
const multer = require('multer');
const imageController = require('../controllers/imageController');

const router = express.Router();

// Configure multer to store images in memory before encoding
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * @route   POST /api/images/upload
 * @desc    Upload a new image
 * @access  Private (Authentication required)
 * @middleware upload.single('file') - Middleware to handle single file upload
 */
router.post('/upload', upload.single('file'), imageController.uploadImage);

/**
 * @route   GET /api/images
 * @desc    Retrieve all uploaded images
 * @access  Public
 */
router.get('/', imageController.getAllImages);

/**
 * @route   GET /api/images/latest-images
 * @desc    Retrieve the most recent images for each image type
 * @access  Public
 */
router.get('/latest-images', imageController.getLatestImagesByType);

/**
 * @route   GET /api/images/:id
 * @desc    Retrieve an image by its ID
 * @access  Public
 */
router.get('/:id', imageController.getImage);

/**
 * @route   DELETE /api/images/:id
 * @desc    Delete an image by its ID
 * @access  Private (Authentication required)
 */
router.delete('/:id', imageController.deleteImage);

/**
 * Export the image-related route definitions.
 * @module routes/images
 */
module.exports = router;
