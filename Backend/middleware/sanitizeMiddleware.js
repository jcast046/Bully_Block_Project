const xss = require("xss-clean");

module.exports = (req, res, next) => {
    // Sanitize request body
    if (req.body && typeof req.body === "object") {
        for (let key in req.body) {
            if (typeof req.body[key] === "string") {
                req.body[key] = xss(req.body[key]);
            }
        }
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === "object") {
        for (let key in req.query) {
            if (typeof req.query[key] === "string") {
                req.query[key] = xss(req.query[key]);
            }
        }
    }

    // Sanitize headers
    if (req.headers && typeof req.headers === "object") {
        for (let key in req.headers) {
            if (typeof req.headers[key] === "string") {
                req.headers[key] = xss(req.headers[key]);
            }
        }
    }

    next();
};
