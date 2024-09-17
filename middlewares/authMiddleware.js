const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
  // Extract the token from the Authorization header
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1]; // Extract token after "Bearer "

  // If token is not present, send an unauthorized error response
  if (!token) return res.status(401).json({ error: 'Access denied, no token provided' });

  try {
    // Verify the token using the JWT secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.userId = decoded.userId; // Store the decoded userId in the request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' }); // Send an error response if the token is invalid
  }
};
