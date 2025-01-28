const express = require('express');
const { getUsers, getUser, addUser, updateUser, deleteUser} = require('../controllers/userController');
const getResource = require('../middleware/getResource');
const School = require('../models/User');

const router = express.Router();

// Get all users
router.get('/', getUsers);

// Get a single user by ID 
router.get('/:id', getResource(School), getUser);

// Add a new user
router.post('/', addUser);

// Update a user
router.put('/:id', getResource(School), updateUser);

// Delete a user
router.delete('/:id', deleteUser);

module.exports = router;
