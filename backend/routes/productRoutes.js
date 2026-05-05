// routes/productRoutes.js - Product routes with admin protection

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const admin = require('../middleware/admin');

// GET /api/products - Get all products (public)
router.get('/', async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = {};
        if (category && category !== 'all') query.category = category;
        if (search) query.name = { $regex: search, $options: 'i' };

        const products = await Product.find(query).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/products/:id - Get single product (public)
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/products - Create product (admin only)
router.post('/', protect, admin, async (req, res) => {
    try {
        const { name, price, description, stock, image, category } = req.body;

        if (!name || !price) {
            return res.status(400).json({ success: false, message: 'Product name and price are required' });
        }

        if (isNaN(price) || price <= 0) {
            return res.status(400).json({ success: false, message: 'Price must be a positive number' });
        }

        const product = await Product.create({
            name: name.trim(),
            price: parseFloat(price),
            description: description ? description.trim() : '',
            stock: parseInt(stock) || 0,
            image: image || 'placeholder.jpg',
            category: category || 'other'
        });

        res.status(201).json({ success: true, product });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// PUT /api/products/:id - Update product (admin only)
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const { name, price, description, stock, image, category } = req.body;
        const updateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (price !== undefined) updateData.price = parseFloat(price);
        if (description !== undefined) updateData.description = description.trim();
        if (stock !== undefined) updateData.stock = parseInt(stock);
        if (image !== undefined) updateData.image = image || 'placeholder.jpg';
        if (category !== undefined) updateData.category = category;

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, product });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// DELETE /api/products/:id - Delete product (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
