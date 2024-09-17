// middlewares/auth.js
const jwt = require('jsonwebtoken');

exports.requireProUser = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from the Authorization header
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY); // Verify and decode the token
    if (decoded.role !== 'pro') {
      return res.status(403).json({ error: 'Pro subscription required to access this resource.' });
    }
    req.user = decoded; // Attach user info to the request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    res.status(401).json({ error: 'Invalid token. Authorization failed.' });
  }
};
