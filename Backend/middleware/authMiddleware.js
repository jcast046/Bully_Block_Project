/**
 * @file authMiddleware.js
 * @description Middleware to authenticate requests using JWT.
 */

const jwt = require('jsonwebtoken');
require('dotenv').config(); // Load environment variables from .env file

/**
 * Middleware function to authenticate JWT tokens in HTTP requests.
 * 
 * Expects the token to be passed in the `Authorization` header in the format:
 * "Bearer <token>". If the token is valid, attaches the decoded user payload
 * to `req.user` and passes control to the next middleware.
 * 
 * Responds with HTTP 401 if no token is provided or if token verification fails.
 *
 * @function authMiddleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
        // Verify and decode token (after removing "Bearer " prefix)
        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        req.user = decoded; // Attach decoded user info to request

        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = authMiddleware;
