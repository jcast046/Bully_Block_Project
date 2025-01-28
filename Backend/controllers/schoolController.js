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

// Update school with PUT
const updateSchool = async (req, res) => {
    try {
        const updatedSchool = await School.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!updatedSchool) {
            return res.status(404).json({ message: 'School not found' });
        }

        res.json(updatedSchool);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete a school
const deleteSchool = async (req, res) => {
    try {
        const deletedSchool = await School.findByIdAndDelete(req.params.id);

        if (!deletedSchool) {
            return res.status(404).json({ message: 'School not found' });
        }

        res.json({ message: 'School deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getSchools, addSchool, getSchool, updateSchool, deleteSchool };