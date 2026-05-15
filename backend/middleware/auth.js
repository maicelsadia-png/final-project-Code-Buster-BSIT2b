// middleware/auth.js - JWT Authentication middleware

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'crumbelle_secret_key_2026';

const protect = async (req, res, next) => {
    let token = null;

    // Check Authorization header (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // Also allow x-user-id fallback for older requests
    const userId = req.headers['x-user-id'];

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = await User.findById(decoded.userId).select('-password');
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'User not found. Please login again.' });
            }
            return next();
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Invalid or expired token. Please login again.' });
        }
    }

    // Fallback: x-user-id header (for backward compat)
    if (userId) {
        try {
            req.user = await User.findById(userId).select('-password');
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'User not found. Please login again.' });
            }
            return next();
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
    }

    return res.status(401).json({ success: false, message: 'Not authorized. Please login first.' });
};

module.exports = { protect };
