// models/Product.js - Restaurant menu item schema

const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    stock: {
        type: Number,
        default: 999,
        min: 0
    },
    available: {
        type: Boolean,
        default: true
    },
    image: {
        type: String,
        default: 'placeholder.jpg'
    },
    imageData: {
        type: String,  // base64 data URI for uploaded images
        default: null
    },
    category: {
        type: String,
        enum: ['meals', 'drinks', 'desserts', 'snacks', 'other'],
        default: 'other'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Mongoose 9 async style — no next()
ProductSchema.pre('save', async function() {
    // nothing needed currently
});

module.exports = mongoose.model('Product', ProductSchema);
