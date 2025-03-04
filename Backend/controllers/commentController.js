const Comment = require('../models/Comment');
const User = require('../models/User');
const Post = require('../models/Post');

// @route   POST /api/comments
// @desc    Create a new comment
// @access  Private
const createComment = async (req, res) => {
    const { comment_id, content, author_id, post_id } = req.body;

    // Ensure all required fields are provided
    if (!content || !author_id || !post_id) {
        return res.status(400).json({ error: "Content, author, and post are required" });
    }

    try {

        // Ensure the author and post exist
        const userExists = await User.findOne({user_id: author_id});
        const postExists = await Post.findOne({post_id: post_id});

        if (!userExists || !postExists) {
            return res.status(404).json({ error: "Author or Post not found" });
        }

        const newComment = new Comment({
            comment_id,  // Set the unique comment_id here
            content,
            author: author_id,
            post: post_id,
        });

        await newComment.save()
        res.status(201).json(newComment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

// @route   GET /api/comments
// @desc    Get all comments
// @access  Public
const getAllComments = async (req, res) => {
    try {
        const comments = await Comment.find();
        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// @route   GET /api/comments/:id
// @desc    Get a single comment by ID
// @access  Public
const getComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        res.json(comment);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// @route   DELETE /api/comments/:id
// @desc    Delete a comment by ID
// @access  Private
const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        await comment.deleteOne();
        res.json({ message: 'Comment deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// @route GET /api/comments/canvas-id/comment_id
// @desc Get comment by its canvas id
// @access Private
const getCommentByCanvasId = async (req, res) => {
    try {
        const comment = await Comment.findOne({ comment_id: req.params.comment_id });
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        res.json(comment);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
}

// @route GET /api/comment/search
// @desc Get comments containing keyword
// @access Private 
const searchComments = async (req, res) => {
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
        console.error("Error in searchComments:", err);
        res.status(500).json({ error: "Server error" });
    }
};


module.exports = { createComment, getAllComments, getCommentByCanvasId, getComment, deleteComment, searchComments };
