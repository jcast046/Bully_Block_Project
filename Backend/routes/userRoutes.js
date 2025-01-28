const express = require('express');
const { getUsers, getUser, addUser, updateUser, deleteUser } = require('../controllers/userController');
const getResource = require('../middleware/getResource');
const User = require('../models/User'); 

const router = express.Router();

// Get all users
router.get('/', getUsers);

// Get a single user by ID 
router.get('/:id', getResource(User), getUser);

// Add a new user
router.post('/', addUser);

// Update a user
router.put('/:id', getResource(User), updateUser);

// Delete a user
router.delete('/:id', deleteUser);

module.exports = router;
