// routes/orderRoutes.js - Order routes

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const admin = require('../middleware/admin');

// POST /api/orders - Create order (authenticated)
router.post('/', protect, async (req, res) => {
    try {
        const { products, totalAmount, paymentMethod, shippingAddress } = req.body;
        const userId = req.user._id;

        if (!products || products.length === 0) {
            return res.status(400).json({ success: false, message: 'Order must contain at least one product' });
        }

        // Enrich products with names and prices from DB
        const enrichedProducts = [];
        for (const item of products) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(400).json({ success: false, message: `Product not found: ${item.productId}` });
            }
            enrichedProducts.push({
                productId: product._id,
                name: product.name,
                quantity: item.quantity || 1,
                price: product.price
            });
        }

        const order = await Order.create({
            userId,
            products: enrichedProducts,
            totalAmount: parseFloat(totalAmount),
            paymentMethod: paymentMethod || 'Cash on Delivery',
            shippingAddress: shippingAddress || {},
            status: 'pending'
        });

        res.status(201).json({ success: true, order });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

// GET /api/orders - Get all orders (admin only)
router.get('/', protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({}).populate('userId', 'name email').sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/orders/user/:userId - Get orders for a specific user (authenticated)
router.get('/user/:userId', protect, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/orders/:id - Get single order (authenticated)
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('userId', 'name email');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/orders/:id/status - Update order status (admin only)
router.put('/:id/status', protect, admin, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid order status' });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: Date.now() },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        res.json({ success: true, order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// PUT /api/orders/:id/cancel - Cancel own order (authenticated)
router.put('/:id/cancel', protect, async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        if (order.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Only pending orders can be cancelled' });
        }
        order.status = 'cancelled';
        order.updatedAt = Date.now();
        await order.save();
        res.json({ success: true, order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

module.exports = router;
