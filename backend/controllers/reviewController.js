// controllers/reviewController.js - Review business logic

const Review = require('../models/Review');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
    try {
        let { userId, productId, productName, userName, rating, comment } = req.body;

        // Validation
        if (!userId || !rating || !comment) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // If productId is missing or not a valid ObjectId, resolve by product name
        const isValidId = productId && mongoose.Types.ObjectId.isValid(productId);
        if (!isValidId) {
            if (!productName) {
                return res.status(400).json({ message: 'Product not identified. Please try again.' });
            }
            const product = await Product.findOne({ name: new RegExp('^' + productName.trim() + '$', 'i') });
            if (!product) {
                return res.status(400).json({ message: `Product "${productName}" not found.` });
            }
            productId = product._id;
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({ userId, productId });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }

        const review = await Review.create({
            userId,
            productId,
            userName: userName || 'Anonymous',
            rating,
            comment
        });

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            review
        });

    } catch (error) {
        if (error.name === 'CastError' && error.path === 'productId') {
            return res.status(400).json({ message: 'Invalid product ID' });
        }
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get reviews by product ID
// @route   GET /api/reviews/product/:productId
// @access  Public
const getReviewsByProduct = async (req, res) => {
    try {
        const reviews = await Review.find({ productId: req.params.productId })
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private/Admin
const deleteReview = async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createReview,
    getReviewsByProduct,
    deleteReview
};