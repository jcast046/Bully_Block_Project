const Post = require('../models/Post');
const User = require('../models/User');

// Function to generate unique post_id
const generateUniquePostId = async () => {
    const lastPost = await Post.find().sort({ _id: -1 }).limit(1);
    const lastId = lastPost.length > 0 ? lastPost[0].post_id : "p50000";  // Default start value
    const newId = `p${parseInt(lastId.slice(1)) + 1}`;  // Increment the number part
    return newId;
};

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
const createPost = async (req, res) => {
    const { content, author } = req.body;

    // Ensure all required fields are provided
    if (!content || !author) {
        return res.status(400).json({ error: "Content and author are required" });
    }

    try {
        // Generate a unique post_id
        const newPostId = await generateUniquePostId();

        // Ensure the author exists in the users collection
        const userExists = await User.findById(author);
        if (!userExists) {
            return res.status(404).json({ error: "Author not found in users collection" });
        }

        const newPost = new Post({
            post_id: newPostId,  // Set the unique post_id here
            content,
            author,
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

module.exports = { createPost, getAllPosts, getPost, updatePost, deletePost };
