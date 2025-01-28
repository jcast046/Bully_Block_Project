const User = require('../models/User');

// Get all users
const getUsers = async (req, res) => {
    try {
        const Users = await User.find();
        res.json(Users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get one user with ID
const getUser = (req, res) => {
    res.json(res.resource);
};

// Add a user
const addUser = async (req, res) => {
    const { user_id, role, username, email } = req.body;

    try {
        const user = new User({ user_id, role, username, email });
        await user.save();
        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update user with PUT
const updateUser = async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete a user
const deleteUser = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getUsers, addUser, getUser, updateUser, deleteUser };