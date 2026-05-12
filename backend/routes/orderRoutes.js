// routes/orderRoutes.js - Restaurant ordering

const express  = require('express');
const router   = express.Router();
const Order    = require('../models/Order');
const Product  = require('../models/Product');
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');
const admin    = require('../middleware/admin');

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
}

// ── POST /api/orders — Place order (authenticated) ────────────────────────────
router.post('/', protect, async (req, res) => {
    try {
        const { products, totalAmount, specialInstructions } = req.body;
        const userId = req.user._id;

        if (!products || products.length === 0) {
            return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
        }

        const enrichedProducts = [];

        for (const item of products) {
            const qty = parseInt(item.quantity) || 1;

            if (isValidObjectId(item.productId)) {
                const product = await Product.findById(item.productId);
                if (product) {
                    enrichedProducts.push({
                        productId: product._id,
                        name:      product.name,
                        quantity:  qty,
                        price:     product.price,
                        image:     product.image || 'placeholder.jpg',
                        imageData: product.imageData || null
                    });
                    continue;
                }
            }

            // Slug fallback
            const slugName = String(item.productId)
                .replace(/-/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase());

            const byName = await Product.findOne({ name: { $regex: slugName.replace(/ /g, '.'), $options: 'i' } });
            if (byName) {
                enrichedProducts.push({
                    productId: byName._id,
                    name: byName.name,
                    quantity: qty,
                    price: byName.price,
                    image: byName.image || 'placeholder.jpg',
                    imageData: byName.imageData || null
                });
            } else {
                enrichedProducts.push({
                    productId: new mongoose.Types.ObjectId(),
                    name: slugName,
                    quantity: qty,
                    price: item.price || 0,
                    image: 'placeholder.jpg'
                });
            }
        }

        const order = await Order.create({
            userId,
            products:            enrichedProducts,
            totalAmount:         parseFloat(totalAmount) || 0,
            paymentMethod:       'Cash at Counter',
            specialInstructions: specialInstructions || '',
            status:              'pending'
        });

        // Decrement stock for each ordered product
        for (const item of enrichedProducts) {
            try {
                await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
            } catch (e) {
                console.warn('Stock update failed for', item.productId, e.message);
            }
        }

        res.status(201).json({ success: true, order });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

// ── GET /api/orders — All orders (admin) ─────────────────────────────────────
// Returns ALL orders; frontend handles archive filter toggling
router.get('/', protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('userId', 'name email username')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ── GET /api/orders/user/:userId — User's orders ──────────────────────────────
router.get('/user/:userId', protect, async (req, res) => {
    try {
        const orders = await Order.find({
            userId: req.params.userId,
            hiddenFromUser: { $ne: true }
        }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ── GET /api/orders/:id — Single order ───────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('userId', 'name email');
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ── PUT /api/orders/:id/status — Update status (admin) ───────────────────────
router.put('/:id/status', protect, admin, async (req, res) => {
    try {
        const { status } = req.body;
        const valid = ['pending', 'preparing', 'ready', 'completed', 'cancelled', 'received', 'archived'];
        if (!valid.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid order status' });
        }
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: Date.now() },
            { new: true }
        );
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.json({ success: true, order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ── PUT /api/orders/:id/cancel — User cancels pending order ──────────────────
router.put('/:id/cancel', protect, async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        if (order.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Only pending orders can be cancelled' });
        }
        order.status = 'cancelled';
        await order.save();
        res.json({ success: true, order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ── PUT /api/orders/:id/received — Customer marks order as received ───────────
router.put('/:id/received', protect, async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        if (!['ready', 'completed'].includes(order.status)) {
            return res.status(400).json({ success: false, message: 'Order must be ready or completed to mark as received' });
        }
        order.status = 'received';
        await order.save();
        res.json({ success: true, order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ── PUT /api/orders/:id/archive — Admin archives an order ────────────────────
// Works on: cancelled, completed, received orders
router.put('/:id/archive', protect, admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const archiveable = ['cancelled', 'completed', 'received'];
        if (!archiveable.includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: 'Only cancelled, completed, or received orders can be archived'
            });
        }
        order.status = 'archived';
        order.updatedAt = Date.now();
        await order.save();
        res.json({ success: true, order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ── DELETE /api/orders/user/clear-history — Customer clears their history ─────
router.delete('/user/clear-history', protect, async (req, res) => {
    try {
        await Order.updateMany({ userId: req.user._id }, { hiddenFromUser: true });
        res.json({ success: true, message: 'Order history cleared' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ── DELETE /api/orders/:id/user-hide — Customer hides single order ────────────
router.delete('/:id/user-hide', protect, async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        if (order.status === 'received' || order.status === 'completed') {
            return res.status(400).json({ success: false, message: 'Received orders cannot be removed from history' });
        }
        order.hiddenFromUser = true;
        await order.save();
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

module.exports = router;
