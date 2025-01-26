const School = require('../models/School');

// Get all schools
const getSchools = async (req, res) => {
    try {
        const schools = await School.find();
        res.json(schools);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get one school with ID
const getSchool = (req, res) => {
    res.json(res.resource);
};

// Add a school
const addSchool = async (req, res) => {
    const { school_id, school_name, location } = req.body;

    try {
        const school = new School({ school_id, school_name, location });
        await school.save();
        res.status(201).json(school);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getSchools, addSchool, getSchool };