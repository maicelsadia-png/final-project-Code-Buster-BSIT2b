// controllers/orderController.js - Order business logic

const Order = require('../models/Order');

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
    try {
        const { userId, products, totalAmount, paymentMethod, shippingAddress } = req.body;
        
        // Validation
        if (!userId || !products || products.length === 0) {
            return res.status(400).json({ message: 'User ID and products are required' });
        }
        
        const order = await Order.create({
            userId,
            products,
            totalAmount,
            paymentMethod: paymentMethod || 'Cash on Delivery',
            shippingAddress,
            status: 'pending'
        });
        
        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order
        });
        
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get orders by user ID
// @route   GET /api/orders/user/:userId
// @access  Private
const getOrdersByUser = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.userId })
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: Date.now() },
            { new: true }
        );
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createOrder,
    getOrdersByUser,
    getAllOrders,
    updateOrderStatus
};