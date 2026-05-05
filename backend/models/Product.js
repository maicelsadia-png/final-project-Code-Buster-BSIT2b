// models/Product.js - Product schema for MongoDB

const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
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
        default: 0,
        min: [0, 'Stock cannot be negative']
    },
    image: {
        type: String,
        default: 'placeholder.jpg'
    },
    category: {
        type: String,
        enum: ['coffee', 'food', 'desserts', 'other'],
        default: 'other'
    },
    sku: {
        type: String,
        unique: true,
        sparse: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create SKU before saving
ProductSchema.pre('save', function(next) {
    if (!this.sku) {
        const prefix = this.category.substring(0, 3).toUpperCase();
        const randomNum = Math.floor(Math.random() * 1000);
        this.sku = `${prefix}-${randomNum}`;
    }
    next();
});

module.exports = mongoose.model('Product', ProductSchema);