// routes/reviewRoutes.js - Review routes

const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order  = require('../models/Order');
const { protect } = require('../middleware/auth');
const admin = require('../middleware/admin');

// POST /api/reviews - Create review (authenticated, must have purchased)
router.post('/', protect, async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        if (!productId || !rating || !comment) {
            return res.status(400).json({ success: false, message: 'Product, rating, and comment are required' });
        }

        // Check: user must have ordered this product
        const hasPurchased = await Order.findOne({
            userId: req.user._id,
            'products.productId': productId,
            status: { $in: ['delivered', 'confirmed', 'shipped'] }
        });
        if (!hasPurchased) {
            return res.status(403).json({ success: false, message: 'You can only review products you have purchased and received.' });
        }

        // Check: not already reviewed
        const existing = await Review.findOne({ userId: req.user._id, productId });
        if (existing) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
        }

        const review = await Review.create({
            userId:   req.user._id,
            productId,
            userName: req.user.name,
            rating:   parseInt(rating),
            comment:  comment.trim()
        });

        res.status(201).json({ success: true, review });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
        }
        res.status(400).json({ success: false, message: error.message });
    }
});

// GET /api/reviews - Get all reviews (admin only)
router.get('/', protect, admin, async (req, res) => {
    try {
        const reviews = await Review.find({})
            .populate('productId', 'name')
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/reviews/user/:userId - Get all reviews by a user (authenticated)
router.get('/user/:userId', protect, async (req, res) => {
    try {
        const reviews = await Review.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/reviews/product/:productId - Get approved reviews for a product (public)
router.get('/product/:productId', async (req, res) => {
    try {
        const reviews = await Review.find({ productId: req.params.productId })
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/reviews/:id - Delete review (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
        res.json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
