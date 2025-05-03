/**
 * @fileoverview Controller for handling comment-related operations.
 * Includes creation, retrieval, deletion, and keyword search functionalities.
 */

const Comment = require('../models/Comment');
const User = require('../models/User');
const Post = require('../models/Post');
const mongoose = require('mongoose');

/**
 * Create a new comment.
 * Validates required fields and ensures that the author and post exist.
 *
 * @function createComment
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} req.body - The request payload containing comment data.
 * @param {string} req.body.comment_id - Unique identifier for the comment.
 * @param {string} req.body.content - Content of the comment.
 * @param {string} req.body.author_id - ID of the user who authored the comment.
 * @param {string} req.body.post_id - ID of the post the comment is associated with.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
const createComment = async (req, res) => {
    const { comment_id, content, author_id, post_id } = req.body;

    if (!content || !author_id || !post_id) {
        return res.status(400).json({ error: "Content, author, and post are required" });
    }

    try {
        const userExists = await User.findOne({ user_id: author_id });
        const postExists = await Post.findOne({ post_id: post_id });

        if (!userExists || !postExists) {
            return res.status(404).json({ error: "Author or Post not found" });
        }

        const newComment = new Comment({
            comment_id,
            content,
            author: author_id,
            post: post_id,
        });

        await newComment.save();
        res.status(201).json(newComment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

/**
 * Retrieve all comments from the database.
 *
 * @function getAllComments
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
const getAllComments = async (req, res) => {
    try {
        const comments = await Comment.find();
        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Retrieve a single comment by its MongoDB `_id`.
 *
 * @function getComment
 * @async
 * @param {Object} req - Express request object.
 * @param {string} req.params.id - The comment's MongoDB `_id`.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
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

/**
 * Delete a comment by its MongoDB `_id`.
 *
 * @function deleteComment
 * @async
 * @param {Object} req - Express request object.
 * @param {string} req.params.id - The comment's MongoDB `_id`.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
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

/**
 * Retrieve a comment by its `comment_id` (canvas-specific ID).
 *
 * @function getCommentByCanvasId
 * @async
 * @param {Object} req - Express request object.
 * @param {string} req.params.comment_id - Canvas-style unique comment ID.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
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
};

/**
 * Search for posts whose string fields contain a given keyword.
 * Also supports searching by author ID if the keyword is a valid MongoDB ObjectId.
 *
 * @function searchComments
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} req.query - The query object.
 * @param {string} req.query.keyword - The keyword to search for.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
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
        console.error("Error in searchComments:", err);
        res.status(500).json({ error: "Server error" });
    }
};

/**
 * Export comment-related controller functions.
 *
 * @module CommentController
 */
module.exports = {
    createComment,
    getAllComments,
    getCommentByCanvasId,
    getComment,
    deleteComment,
    searchComments
};
