// Middleware for retrieving a resource.

function getResource(Model) {
    return async (req, res, next) => {
        let resource;
        try {
            resource = await Model.findById(req.params.id);
            if (!resource) {
                return res.status(404).json({message: `${Model.modelName} not found`})
            }
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
        res.resource = resource;
        next();
    };
}

module.exports = getResource;