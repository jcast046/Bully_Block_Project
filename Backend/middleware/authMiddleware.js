const authMiddleware = (req, res, next) => {
  // Example middleware logic
  const token = req.header('Authorization');
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }
  next();
};

module.exports = authMiddleware;
