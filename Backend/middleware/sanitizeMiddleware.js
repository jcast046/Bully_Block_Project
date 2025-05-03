/**
 * @file sanitizeRequest.js
 * @description Middleware to deeply sanitize incoming request data using xss-clean to prevent XSS attacks.
 */

const xss = require("xss-clean");

/**
 * Middleware function to sanitize all string values in the request body and query to prevent XSS attacks.
 * Uses deep recursion to ensure nested properties are sanitized.
 * Headers are not sanitized to avoid interfering with authentication tokens or metadata.
 *
 * @function sanitizeRequest
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const sanitizeRequest = (req, res, next) => {
    /**
     * Recursively sanitize all strings in an object.
     *
     * @param {*} obj - The object or value to sanitize
     * @returns {*} - The sanitized object or value
     */
    const deepSanitize = (obj) => {
        if (typeof obj === "string") {
            return xss(obj);
        } else if (typeof obj === "object" && obj !== null) {
            for (let key in obj) {
                obj[key] = deepSanitize(obj[key]);
            }
        }
        return obj;
    };

    // Sanitize request body and query parameters
    req.body = deepSanitize(req.body);
    req.query = deepSanitize(req.query);

    next();
};

module.exports = sanitizeRequest;
