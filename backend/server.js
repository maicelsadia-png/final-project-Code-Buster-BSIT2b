// server.js - Main server file

require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// ========================================
// ROUTES
// ========================================
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

const orderRoutes = require('./routes/orderRoutes');
app.use('/api/orders', orderRoutes);

const reviewRoutes = require('./routes/reviewRoutes');
app.use('/api/reviews', reviewRoutes);

// ========================================
// AUTO-SEED ADMIN ON STARTUP
// ========================================
async function seedAdmin() {
    try {
        const mongoose = require('mongoose');
        const User = require('./models/User');

        // Drop the stale username_1 index if it exists (leftover from old schema)
        try {
            const collection = mongoose.connection.collection('users');
            const indexes = await collection.indexes();
            const hasStaleIndex = indexes.some(idx => idx.name === 'username_1');
            if (hasStaleIndex) {
                await collection.dropIndex('username_1');
                console.log('🧹 Dropped stale username_1 index');
            }
        } catch (idxErr) {
            // Index may not exist — safe to ignore
        }

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('✅ Admin account exists:', existingAdmin.email);
            return;
        }

        // Create admin (password hashed by pre-save hook)
        await User.create({
            name: 'Admin',
            email: 'admin@quickserve.com',
            password: 'admin123',
            role: 'admin'
        });
        console.log('✅ Admin account created: admin@quickserve.com / admin123');

    } catch (err) {
        console.error('Admin seed error:', err.message);
    }
}

// ========================================
// API INFO ROUTE
// ========================================
app.get('/api', (req, res) => {
    res.json({
        message: 'QuickServe API is running',
        version: '2.0.0',
        admin: 'admin@quickserve.com / admin123'
    });
});

// ========================================
// SERVE FRONTEND PAGES
// ========================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ========================================
// 404 HANDLER
// ========================================
app.use((req, res) => {
    if (req.url.startsWith('/api/')) {
        return res.status(404).json({ message: `Route ${req.url} not found` });
    }
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ========================================
// START SERVER
// ========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`\n📋 Available routes:`);
    console.log(`   POST  /api/users            - Register`);
    console.log(`   POST  /api/auth/login       - Login`);
    console.log(`   GET   /api/products         - Get all products`);
    console.log(`   POST  /api/products         - Add product (admin)`);
    console.log(`   PUT   /api/products/:id     - Update product (admin)`);
    console.log(`   DELETE /api/products/:id    - Delete product (admin)`);
    console.log(`   POST  /api/orders           - Create order`);
    console.log(`   GET   /api/orders           - Get all orders (admin)`);
    console.log(`   GET   /api/orders/user/:id  - Get user orders`);
    console.log(`   GET   /api/users            - Get all users (admin)`);
    console.log(`\n🔐 Admin seeding...`);

    // Wait for DB connection before seeding
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
        await seedAdmin();
    } else {
        mongoose.connection.once('connected', async () => {
            await seedAdmin();
        });
    }

    console.log(`\n✅ QuickServe is ready!\n`);
});
