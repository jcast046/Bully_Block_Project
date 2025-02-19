const xss = require("xss-clean");

// Middleware function for deep sanitization
const sanitizeRequest = (req, res, next) => {
    // Function to recursively sanitize input data
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

    // Sanitize request body, query, and params
    req.body = deepSanitize(req.body);
    req.query = deepSanitize(req.query);
    
    // Skip headers sanitization to avoid interfering with authentication
    next();
};

module.exports = sanitizeRequest;
