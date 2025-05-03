const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');

/**
 * Create a new post.
 * 
 * @route POST /api/posts
 * @access Private
 * @param {Object} req - Express request object containing post_id, content, and author_id
 * @param {Object} res - Express response object
 * @returns {Object} JSON representation of the newly created post or an error
 */
const createPost = async (req, res) => {
    const { post_id, content, author_id } = req.body;

    if (!content || !author_id) {
        return res.status(400).json({ error: "Content and author are required" });
    }

    try {
        const userExists = await User.findOne({ user_id: author_id });
        if (!userExists) {
            return res.status(404).json({ error: "Author not found in users collection" });
        }

        const newPost = new Post({
            post_id,
            content,
            author: author_id,
        });

        await newPost.save();
        res.status(201).json(newPost);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

/**
 * Retrieve all posts.
 * 
 * @route GET /api/posts
 * @access Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object[]} List of posts or error
 */
const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find();
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Retrieve a single post by MongoDB ID.
 * 
 * @route GET /api/posts/:id
 * @access Public
 * @param {Object} req - Express request object with `id` param
 * @param {Object} res - Express response object
 * @returns {Object} Post object or error
 */
const getPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Update a post by ID.
 * 
 * @route PUT /api/posts/:id
 * @access Private
 * @param {Object} req - Express request object with `id` param and updated content
 * @param {Object} res - Express response object
 * @returns {Object} Updated post or error
 */
const updatePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.author.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        post.content = req.body.content || post.content;
        post.updatedAt = Date.now();

        await post.save();
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Delete a post by ID.
 * 
 * @route DELETE /api/posts/:id
 * @access Private
 * @param {Object} req - Express request object with `id` param
 * @param {Object} res - Express response object
 * @returns {Object} Deletion confirmation or error
 */
const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        await post.deleteOne();
        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Retrieve a post using its canvas-specific ID.
 * 
 * @route GET /api/posts/canvas-id/:post_id
 * @access Private
 * @param {Object} req - Express request object with `post_id` param
 * @param {Object} res - Express response object
 * @returns {Object} Post object or error
 */
const getPostByCanvasId = async (req, res) => {
    try {
        const post = await Post.findOne({ post_id: req.params.post_id });
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Search posts by keyword.
 * 
 * @route GET /api/posts/search
 * @access Private
 * @param {Object} req - Express request object with `keyword` query parameter
 * @param {Object} res - Express response object
 * @returns {Object[]} List of matched posts or error
 */
const searchPosts = async (req, res) => {
    try {
        const { keyword } = req.query;
        if (!keyword) {
            return res.status(400).json({ error: "Keyword is required" });
        }

        const sampleDoc = await Post.findOne();
        if (!sampleDoc) {
            return res.json([]);
        }

        const fields = Object.keys(sampleDoc.toObject()).filter(field => 
            typeof sampleDoc[field] === "string"
        );

        const query = {
            $or: fields.map(field => ({
                [field]: { $regex: keyword, $options: 'i' }
            }))
        };

        if (mongoose.Types.ObjectId.isValid(keyword)) {
            query.$or.push({ author: new mongoose.Types.ObjectId(keyword) });
        }

        const results = await Post.find(query);
        res.json(results);
    } catch (err) {
        console.error("Error in searchPosts:", err);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { createPost, getAllPosts, getPost, updatePost, deletePost, getPostByCanvasId, searchPosts };
