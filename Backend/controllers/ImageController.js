const ImageModel = require('../models/image');

// Upload Image
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
            imageType: req.body.imageType || 'other' // Accepts imageType from request body
        });

        await newImage.save();
        res.json({ message: 'Image saved!', id: newImage._id });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
};

// Get Image by ID
exports.getImage = async (req, res) => {
    try {
        const image = await ImageModel.findById(req.params.id);

        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }

        res.json({
            name: image.name,
            img: image.img, // Base64-encoded image
            imageType: image.imageType,
            timestamp: image.timestamp
        });

    } catch (error) {
        console.error('Retrieve Error:', error);
        res.status(500).json({ error: 'Failed to retrieve image' });
    }
};

// Get All Images
exports.getAllImages = async (req, res) => {
    try {
        // Fetch all images from the database
        const images = await ImageModel.find({}, 'name img imageType timestamp');

        const imagesData = images.map(image => ({
            name: image.name,
            img: image.img, // Base64-encoded image
            imageType: image.imageType,
            timestamp: image.timestamp
        }));

        res.json(imagesData); // Send the array of images as the response
    } catch (error) {
        console.error('Retrieve All Error:', error);
        res.status(500).json({ error: 'Failed to retrieve images' });
    }
};

// Delete Image by ID
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
