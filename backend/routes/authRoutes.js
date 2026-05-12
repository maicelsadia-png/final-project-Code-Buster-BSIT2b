// routes/authRoutes.js - Authentication

const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { protect } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'quickserve_secret_key_2026';

// POST /api/auth/login - supports email OR username
router.post('/login', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const identifier = email || username;

        if (!identifier || !password) {
            return res.status(400).json({ success: false, message: 'Email/username and password are required' });
        }

        // Find by email or username
        const user = await User.findOne({
            $or: [
                { email: identifier.toLowerCase().trim() },
                { username: identifier.toLowerCase().trim() }
            ]
        });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials. Please check your email/username and password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials. Please check your email/username and password.' });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            userId: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

// GET /api/auth/me - Get current user info (used to validate session & refresh user data)
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, _id: user._id, name: user.name, email: user.email, role: user.role, username: user.username });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
