const User = require('../models/User')

const getUsers = async (req, res) => {
    try{
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
};

const addUser = async (req, res) => {
    const {user_id, role, username, email}= req.body;

    try{
        const user = new User({user_id, role, username, email});
        await user.save();
        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
};

module.exports ={getUsers, addUser};