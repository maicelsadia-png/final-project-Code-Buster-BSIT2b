// models/Order.js - Restaurant pre-ordering system

const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.Mixed, ref: 'Product' },
    name:      { type: String, required: true },
    quantity:  { type: Number, required: true, min: 1 },
    price:     { type: Number, required: true, min: 0 },
    image:     { type: String, default: 'placeholder.jpg' },
    imageData: { type: String, default: null }  // base64 for cross-device display
});

const OrderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    products: [OrderItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled', 'received', 'archived'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        default: 'Cash at Counter'
    },
    specialInstructions: {
        type: String,
        default: ''
    },
    hiddenFromUser:  { type: Boolean, default: false },
    hiddenFromAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Mongoose 9 async style — no next()
OrderSchema.pre('save', async function() {
    if (!this.orderNumber) {
        const date  = new Date();
        const yr    = date.getFullYear().toString().slice(-2);
        const mo    = (date.getMonth() + 1).toString().padStart(2, '0');
        const rand  = Math.floor(Math.random() * 9000 + 1000).toString();
        this.orderNumber = `QS-${yr}${mo}-${rand}`;
    }
    this.updatedAt = Date.now();
});

module.exports = mongoose.model('Order', OrderSchema);
