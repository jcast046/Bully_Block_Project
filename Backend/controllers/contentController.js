const Content = require('../models/Content');
const User = require('../models/User');

// @route   POST /api/content
// @desc    Create a new content post
// @access  Private 
const createContent = async (req, res) => {
    const { contentType, content, author } = req.body;

    // Ensure all required fields are provided
    if (!contentType || !content || !author) {
        return res.status(400).json({ error: "Content type, content, and author are required" });
    }

    try {
        const newContent = new Content({
            contentType,
            content,
            author,
        });

        // Author must exist in users collection
        const userExists = await User.findById(author);
        if (!userExists) {
            return res.status(404).json({ error: "Author not found in users collection" });
        }

        await newContent.save();
        res.status(201).json(newContent);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};


// @route   GET /api/content
// @desc    Get all discussion posts
// @access  Public
const getAllContent = async (req, res) => {
    try {
        const content = await Content.find();
        res.json(content);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// @route   GET /api/content/:id
// @desc    Get a single discussion post by ID
// @access  Public
const getContent = async (req, res) => {
    try {
        const content = await Content.findById(req.params.id);
        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }
        res.json(content);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// @route   PUT /api/content/:id
// @desc    Update a discussion post
// @access  Private 
const updateContent = async (req, res) => {
    try {
        const content = await Content.findById(req.params.id);

        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        
        if (content.author.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        content.content = req.body.content || content.content;
        content.updatedAt = Date.now();

        await content.save();
        res.json(content);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// @route   DELETE /api/content/:id
// @desc    Delete a discussion post
// @access  Private 
const deleteContent = async (req, res) => {
    try {
        const content = await Content.findById(req.params.id);

        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        await content.deleteOne();
        res.json({ message: 'Content deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { createContent, getAllContent, getContent, updateContent, deleteContent };
