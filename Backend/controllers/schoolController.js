const School = require('../models/School');
const authMiddleware = require('../middleware/authMiddleware'); // Import auth middleware

/**
 * Get all schools (Public)
 * @route GET /schools
 * @access Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSchools = async (req, res) => {
    try {
        const schools = await School.find();
        res.json(schools);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * Get a single school by ID (Protected)
 * @route GET /schools/:id
 * @access Protected
 * @middleware authMiddleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSchool = [authMiddleware, (req, res) => {
    res.json(res.resource);
}];

/**
 * Add a new school (Protected)
 * @route POST /schools
 * @access Protected
 * @middleware authMiddleware
 * @param {Object} req - Express request object (expects school_id, school_name, location in body)
 * @param {Object} res - Express response object
 */
const addSchool = [authMiddleware, async (req, res) => {
    const { school_id, school_name, location } = req.body;

    try {
        const school = new School({ school_id, school_name, location });
        await school.save();
        res.status(201).json(school);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}];

/**
 * Update an existing school by ID (Protected)
 * @route PUT /schools/:id
 * @access Protected
 * @middleware authMiddleware
 * @param {Object} req - Express request object (expects update data in body)
 * @param {Object} res - Express response object
 */
const updateSchool = [authMiddleware, async (req, res) => {
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
}];

/**
 * Delete a school by ID (Protected)
 * @route DELETE /schools/:id
 * @access Protected
 * @middleware authMiddleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteSchool = [authMiddleware, async (req, res) => {
    try {
        const deletedSchool = await School.findByIdAndDelete(req.params.id);

        if (!deletedSchool) {
            return res.status(404).json({ message: 'School not found' });
        }

        res.json({ message: 'School deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}];

module.exports = { getSchools, addSchool, getSchool, updateSchool, deleteSchool };
