const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
const createPost = async (req, res) => {
    const { post_id, content, author_id } = req.body;

    // Ensure all required fields are provided
    if (!content || !author_id) {
        return res.status(400).json({ error: "Content and author are required" });
    }

    try {

        // Ensure the author exists in the users collection
        const userExists = await User.findOne({ user_id: author_id });
        if (!userExists) {
            return res.status(404).json({ error: "Author not found in users collection" });
        }

        const newPost = new Post({
            post_id,  // Set the unique post_id here
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

// @route   GET /api/posts
// @desc    Get all posts
// @access  Public
const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find();
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// @route   GET /api/posts/:id
// @desc    Get a single post by ID
// @access  Public
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

// @route   PUT /api/posts/:id
// @desc    Update a post by ID
// @access  Private
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


// @route   DELETE /api/posts/:id
// @desc    Delete a post by ID
// @access  Private
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

// @route GET /api/posts/canvas-id/post_id
// @desc Get post by its canvas id
// @access Private
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
}

// @route GET /api/posts/search
// @desc Get posts containing keyword
// @access Private 
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

        // search for strings
        const fields = Object.keys(sampleDoc.toObject()).filter(field => 
            typeof sampleDoc[field] === "string"
        );

        const query = {
            $or: fields.map(field => ({
                [field]: { $regex: keyword, $options: 'i' }
            }))
        };

        // Check if the keyword is a valid ObjectId to search for author
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

module.exports = { createPost, getAllPosts, getPost, updatePost, deletePost,  getPostByCanvasId, searchPosts};
