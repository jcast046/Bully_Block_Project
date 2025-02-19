const express = require('express');
const multer = require('multer');
const imageController = require('../controllers/imageController');

const router = express.Router();
const storage = multer.memoryStorage(); // Store image in memory before encoding
const upload = multer({ storage });

// Upload Image
router.post('/upload', upload.single('file'), imageController.uploadImage);

// Get All Images
router.get('/', imageController.getAllImages);

// Get most recent images for each type
router.get('/latest-images', imageController.getLatestImagesByType)

// Get Image by ID
router.get('/:id', imageController.getImage);

// Delete Image by ID
router.delete('/:id', imageController.deleteImage);

module.exports = router;
