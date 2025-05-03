/**
 * @file getResource.js
 * @description Middleware factory to retrieve a resource by ID from a Mongoose model.
 */

/**
 * Middleware factory to fetch a resource by ID from a given Mongoose model.
 *
 * This middleware attempts to find a document by `req.params.id` using the provided `Model`.
 * If the resource is found, it is attached to `res.resource` for use in subsequent middleware or route handlers.
 * If not found, responds with a 404 error. If an error occurs during retrieval, responds with a 500 error.
 *
 * @function getResource
 * @param {import('mongoose').Model} Model - Mongoose model to query
 * @returns {Function} Express middleware function
 */
function getResource(Model) {
    return async (req, res, next) => {
        let resource;
        try {
            resource = await Model.findById(req.params.id);
            if (!resource) {
                return res.status(404).json({ message: `${Model.modelName} not found` });
            }
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
        res.resource = resource;
        next();
    };
}

module.exports = getResource;
