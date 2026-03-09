import { verifyToken } from '../utils/jwt.js';

export const requireAuth = (req, res, next) => {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Attach user info to request
    req.userId = decoded.userId;
    req.username = decoded.username;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};