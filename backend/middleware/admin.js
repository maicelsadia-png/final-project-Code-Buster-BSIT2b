// middleware/admin.js - Check if user is admin

const admin = (req, res, next) => {
    // Check if user exists and has admin role
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ 
            success: false,
            message: 'Access denied. Admin only.' 
        });
    }
};

module.exports = admin;