const jwt = require('jsonwebtoken');
require('dotenv').config(); // Load environment variables

const authMiddleware = (req, res, next) => {
    // Retrieve token from Authorization header
    const token = req.header('Authorization');

    if (!token) {
        // If no token provided, return 401 Unauthorized
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
        // Verify token after removing the 'Bearer ' prefix
        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        
        // Attach user info to the request object for use in subsequent routes
        req.user = decoded;

        next(); // Call the next middleware or route handler
    } catch (err) {
        // If token is invalid, return 401 Unauthorized
        res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = authMiddleware;
