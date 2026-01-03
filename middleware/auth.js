// Authentication middleware for validating JWT tokens
const jwt = require('jsonwebtoken');

// Function to validate token
function validateToken(authHeader) {
  console.log('Validating token with auth header:', authHeader);
  
  // Extract the token from the header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Token validation failed: Invalid auth header format');
    return false;
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  console.log('Extracted token:', token);
  
  // For our simulated authentication, we check if it's a valid simulated token
  // In a real app, you would use jwt.verify(token, process.env.JWT_SECRET)
  const isValid = token && token.startsWith('simulated-token-');
  console.log('Token validation result:', isValid);
  
  return isValid;
}

// Authentication middleware
function authenticateToken(req, res, next) {
  console.log('Authentication middleware called for:', req.method, req.url);
  
  // Get the authorization header
  const authHeader = req.headers['authorization'];
  console.log('Authorization header:', authHeader);
  
  // Check if authorization header exists
  if (!authHeader) {
    console.log('Authentication failed: Access token required');
    return res.status(401).json({ message: 'Access token required' });
  }
  
  // For our simulated authentication, we just check if the header exists
  // In a real app, you would verify the JWT token here
  if (!validateToken(authHeader)) {
    console.log('Authentication failed: Invalid or expired token');
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  
  console.log('Authentication successful');
  
  // If validation passes, continue to the next middleware/route handler
  next();
}

module.exports = { authenticateToken };