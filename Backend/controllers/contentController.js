const Content = require('../models/Content');
const User = require('../models/User');

/**
 * Create a new content post
 * 
 * @route POST /api/content
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with newly created content or error message
 */
const createContent = async (req, res) => {
    const { contentType, content, author } = req.body;

    if (!contentType || !content || !author) {
        return res.status(400).json({ error: "Content type, content, and author are required" });
    }

    try {
        const newContent = new Content({
            contentType,
            content,
            author,
        });

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

/**
 * Get all discussion posts
 * 
 * @route GET /api/content
 * @access Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON array of content posts or error message
 */
const getAllContent = async (req, res) => {
    try {
        const content = await Content.find();
        res.json(content);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Get a single discussion post by ID
 * 
 * @route GET /api/content/:id
 * @access Public
 * @param {Object} req - Express request object (expects `id` param)
 * @param {Object} res - Express response object
 * @returns {Object} JSON object of content or error message
 */
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

/**
 * Update a discussion post
 * 
 * @route PUT /api/content/:id
 * @access Private
 * @param {Object} req - Express request object (expects `id` param and `user.id`)
 * @param {Object} res - Express response object
 * @returns {Object} JSON object of updated content or error message
 */
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

/**
 * Delete a discussion post
 * 
 * @route DELETE /api/content/:id
 * @access Private
 * @param {Object} req - Express request object (expects `id` param)
 * @param {Object} res - Express response object
 * @returns {Object} JSON success message or error message
 */
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
