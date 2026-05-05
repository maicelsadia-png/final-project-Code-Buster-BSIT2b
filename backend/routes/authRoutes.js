// routes/authRoutes.js - Authentication routes with JWT

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'quickserve_secret_key_2026';

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
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
            email: user.email,
            role: user.role
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

// POST /api/auth/seed-admin - Create admin account if not exists
router.post('/seed-admin', async (req, res) => {
    try {
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            return res.json({ success: true, message: 'Admin already exists', email: existingAdmin.email });
        }

        const admin = await User.create({
            name: 'Admin',
            email: 'admin@quickserve.com',
            password: 'admin123',
            role: 'admin'
        });

        res.status(201).json({
            success: true,
            message: 'Admin account created',
            email: admin.email,
            defaultPassword: 'admin123'
        });
    } catch (error) {
        console.error('Seed admin error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
