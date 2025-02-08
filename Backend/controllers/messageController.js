const Message = require('../models/Message');
const User = require('../models/User');

// Function to generate a unique message_id
const generateUniqueMessageId = async () => {
    const lastMessage = await Message.find().sort({ _id: -1 }).limit(1);
    const lastId = lastMessage.length > 0 ? lastMessage[0].message_id : "cm10000";  // Default start value
    const newId = `cm${parseInt(lastId.slice(2)) + 1}`;  // Increment the number part
    return newId;
};

// @route   POST /api/messages
// @desc    Create a new message
// @access  Private
const createMessage = async (req, res) => {
    const { content, author, recipient } = req.body;

    // Ensure all required fields are provided
    if (!content || !author || !recipient) {
        return res.status(400).json({ error: "Content, author, and recipient are required" });
    }

    try {
        // Generate a unique message_id
        const newMessageId = await generateUniqueMessageId();

        // Ensure the author and recipient exist in the users collection
        const authorExists = await User.findById(author);
        const recipientExists = await User.findById(recipient);
        if (!authorExists || !recipientExists) {
            return res.status(404).json({ error: "Author or recipient not found in users collection" });
        }

        const newMessage = new Message({
            message_id: newMessageId,  // Set the unique message_id here
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

// @route   GET /api/messages
// @desc    Get all messages
// @access  Public
const getAllMessages = async (req, res) => {
    try {
        const messages = await Message.find();
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// @route   GET /api/messages/:id
// @desc    Get a single message by ID
// @access  Public
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

// @route   DELETE /api/messages/:id
// @desc    Delete a message by ID
// @access  Private
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

module.exports = { createMessage, getAllMessages, getMessage, deleteMessage };
