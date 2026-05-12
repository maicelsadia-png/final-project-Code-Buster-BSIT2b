// controllers/reviewController.js - Review business logic

const Review = require('../models/Review');

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
    try {
        const { userId, productId, userName, rating, comment } = req.body;
        
        // Validation
        if (!userId || !productId || !rating || !comment) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        // Check if user already reviewed this product
        const existingReview = await Review.findOne({ userId, productId });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }
        
        const review = await Review.create({
            userId,
            productId,
            userName,
            rating,
            comment
        });
        
        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            review
        });
        
    } catch (error) {
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