const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Generates a unique message ID by incrementing the last used ID.
 * @async
 * @function generateUniqueMessageId
 * @returns {Promise<string>} The new unique message ID.
 */
const generateUniqueMessageId = async () => {
    const lastMessage = await Message.find().sort({ _id: -1 }).limit(1);
    const lastId = lastMessage.length > 0 ? lastMessage[0].message_id : "cm10000";  // Default start value
    const newId = `cm${parseInt(lastId.slice(2)) + 1}`;  // Increment the number part
    return newId;
};

/**
 * Creates a new message.
 * @async
 * @function createMessage
 * @param {Object} req - Express request object, containing message content, author, and recipient.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
const createMessage = async (req, res) => {
    const { content, author, recipient } = req.body;

    if (!content || !author || !recipient) {
        return res.status(400).json({ error: "Content, author, and recipient are required" });
    }

    try {
        const newMessageId = await generateUniqueMessageId();

        const authorExists = await User.findById(author);
        const recipientExists = await User.findById(recipient);
        if (!authorExists || !recipientExists) {
            return res.status(404).json({ error: "Author or recipient not found in users collection" });
        }

        const newMessage = new Message({
            message_id: newMessageId,
            content,
            author,
            recipient,
        });

        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

/**
 * Retrieves all messages.
 * @async
 * @function getAllMessages
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
const getAllMessages = async (req, res) => {
    try {
        const messages = await Message.find();
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Retrieves a single message by its MongoDB ID.
 * @async
 * @function getMessage
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
const getMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        res.json(message);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Deletes a message by its MongoDB ID.
 * @async
 * @function deleteMessage
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
const deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        await message.deleteOne();
        res.json({ message: 'Message deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Searches messages for a keyword in string fields or by author ID if valid.
 * @async
 * @function searchMessages
 * @param {Object} req - Express request object, including `keyword` in query params.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
const searchMessages = async (req, res) => {
    try {
        const { keyword } = req.query;
        if (!keyword) {
            return res.status(400).json({ error: "Keyword is required" });
        }

        const sampleDoc = await Message.findOne();
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

        const results = await Message.find(query);
        res.json(results);
    } catch (err) {
        console.error("Error in searchMessages:", err);
        res.status(500).json({ error: "Server error" });
    }
};

/**
 * Message controller exports.
 * @module controllers/messageController
 */
module.exports = { createMessage, getAllMessages, getMessage, deleteMessage, searchMessages };
