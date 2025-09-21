// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
require('dotenv').config();

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  // Token format: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ msg: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // attach user info to req
    next(); // allow route handler to continue
  } catch (err) {
    return res.status(403).json({ msg: 'Invalid or expired token' });
  }
}

module.exports = verifyToken;
