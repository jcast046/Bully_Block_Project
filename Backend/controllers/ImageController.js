const ImageModel = require('../models/Image');

/**
 * @function uploadImage
 * @description Handles image upload, converts it to Base64, and stores it in the database.
 * @param {Object} req - Express request object (expects `req.file` and optional `req.body.imageType`)
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with success message and saved image ID or error message
 */
exports.uploadImage = async (req, res) => {
    try {
        console.log('Received file:', req.file);

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const imageBuffer = req.file.buffer;
        const base64Image = imageBuffer.toString('base64');

        const newImage = new ImageModel({
            name: req.file.originalname,
            img: `data:image/png;base64,${base64Image}`,
            imageType: req.body.imageType || 'other'
        });

        await newImage.save();
        res.json({ message: 'Image saved!', id: newImage._id });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
};

/**
 * @function getImage
 * @description Retrieves a single image by its ID from the database.
 * @param {Object} req - Express request object (expects `req.params.id`)
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with image data or error message
 */
exports.getImage = async (req, res) => {
    try {
        const image = await ImageModel.findById(req.params.id);

        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }

        res.json({
            name: image.name,
            img: image.img,
            imageType: image.imageType,
            timestamp: image.timestamp
        });

    } catch (error) {
        console.error('Retrieve Error:', error);
        res.status(500).json({ error: 'Failed to retrieve image' });
    }
};

/**
 * @function getAllImages
 * @description Retrieves all images stored in the database.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON array of all images with metadata
 */
exports.getAllImages = async (req, res) => {
    try {
        const images = await ImageModel.find({}, 'name img imageType timestamp');

        const imagesData = images.map(image => ({
            name: image.name,
            img: image.img,
            imageType: image.imageType,
            timestamp: image.timestamp
        }));

        res.json(imagesData);
    } catch (error) {
        console.error('Retrieve All Error:', error);
        res.status(500).json({ error: 'Failed to retrieve images' });
    }
};

/**
 * @function getLatestImagesByType
 * @description Retrieves the most recent image for each image type.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON array of latest images grouped by image type
 */
exports.getLatestImagesByType = async (req, res) => {
    try {
        const latestImages = await ImageModel.aggregate([
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: "$imageType",
                    name: { $first: "$name" },
                    img: { $first: "$img" },
                    imageType: { $first: "$imageType" },
                    timestamp: { $first: "$timestamp" }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: 1,
                    img: 1,
                    imageType: 1,
                    timestamp: 1
                }
            }
        ]);

        res.json(latestImages);

    } catch (error) {
        console.error('Retrieve Latest Images Error:', error);
        res.status(500).json({ error: 'Failed to retrieve latest images' });
    }
};

/**
 * @function deleteImage
 * @description Deletes an image by its ID from the database.
 * @param {Object} req - Express request object (expects `req.params.id`)
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with success message or error message
 */
exports.deleteImage = async (req, res) => {
    try {
        const deletedImage = await ImageModel.findByIdAndDelete(req.params.id);

        if (!deletedImage) {
            return res.status(404).json({ error: 'Image not found' });
        }

        res.json({ message: 'Image deleted successfully' });

    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
};
