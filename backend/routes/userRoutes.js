// routes/userRoutes.js

const express  = require('express');
const router   = express.Router();
const User     = require('../models/User');
const bcrypt   = require('bcryptjs');
const { protect } = require('../middleware/auth');
const admin    = require('../middleware/admin');

// POST /api/users - Register
router.post('/', async (req, res) => {
    try {
        const { name, username, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        // Check duplicate email
        const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
        if (emailExists) {
            return res.status(400).json({ success: false, message: 'An account with this email already exists' });
        }

        // Check duplicate username if provided
        if (username) {
            const usernameExists = await User.findOne({ username: username.toLowerCase().trim() });
            if (usernameExists) {
                return res.status(400).json({ success: false, message: 'This username is already taken' });
            }
        }

        const user = await User.create({
            name: name.trim(),
            username: username ? username.toLowerCase().trim() : undefined,
            email: email.toLowerCase().trim(),
            password,
            role: 'user'
        });

        res.status(201).json({
            success: true,
            message: 'Account created successfully! Please login.',
            userId: user._id,
            name: user.name,
            email: user.email
        });

    } catch (error) {
        console.error('Register error:', error);
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ success: false, message: `This ${field} is already taken` });
        }
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

// GET /api/users - All users (admin)
router.get('/', protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/users/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/users/:id - Update profile
router.put('/:id', protect, async (req, res) => {
    try {
        const { name, email, phone, username } = req.body;
        const update = {};
        if (name)     update.name     = name.trim();
        if (email)    update.email    = email.toLowerCase().trim();
        if (phone !== undefined) update.phone = phone;
        if (username) update.username = username.toLowerCase().trim();

        const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, ...user.toObject() });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Email or username already in use' });
        }
        res.status(400).json({ success: false, message: error.message });
    }
});

// PUT /api/users/:id/password - Change password
router.put('/:id/password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Both current and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

        user.password = newPassword; // pre-save hook hashes it
        await user.save({ validateBeforeSave: false });

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/users/:id (admin)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
