// routes/productRoutes.js - Restaurant menu items

const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const admin   = require('../middleware/admin');

// ========================================
// MULTER - Backend image upload storage
// ========================================
const multer = require('multer');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'product-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const extOk  = allowed.test(path.extname(file.originalname).toLowerCase());
        const mimeOk = allowed.test(file.mimetype);
        if (extOk && mimeOk) return cb(null, true);
        cb(new Error('Only image files are allowed (jpg, png, gif, webp)'));
    }
});

// ========================================
// POST /api/products/upload-image (admin)
// Uploads image to backend/uploads/ and returns the public path
// ========================================
router.post('/upload-image', protect, admin, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file provided' });
    }
    // Return the relative path that can be used as a public URL
    const imagePath = '/uploads/' + req.file.filename;
    res.json({ success: true, imagePath });
});

// GET /api/products - Public menu
// Helper: if a product has an /uploads/ image but no imageData, read the file and return base64.
// Also saves it back to the DB so future requests don't need to re-read the file.
async function injectImageData(product) {
    if (product.imageData || !product.image || !product.image.startsWith('/uploads/')) return product;
    const filePath = path.join(__dirname, '..', 'uploads', path.basename(product.image));
    if (!fs.existsSync(filePath)) return product;
    try {
        const ext  = path.extname(filePath).toLowerCase().replace('.', '');
        const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        const b64  = fs.readFileSync(filePath).toString('base64');
        const dataUri = `data:${mime};base64,${b64}`;
        // Save back to DB so next request is instant
        await Product.findByIdAndUpdate(product._id, { imageData: dataUri });
        product.imageData = dataUri;
    } catch (e) { /* file unreadable, skip */ }
    return product;
}

router.get('/', async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = {};
        if (category && category !== 'all') query.category = category;
        if (search) query.name = { $regex: search, $options: 'i' };
        const products = await Product.find(query).sort({ createdAt: -1 });
        // Inject imageData for any uploaded-image products that are missing it
        const fixed = await Promise.all(products.map(p => injectImageData(p)));
        res.json(fixed);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Item not found' });
        await injectImageData(product);
        res.json(product);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/products (admin)
router.post('/', protect, admin, async (req, res) => {
    try {
        const { name, price, description, stock, image, imageData, category, available } = req.body;
        if (!name || price === undefined || price === '') {
            return res.status(400).json({ success: false, message: 'Item name and price are required' });
        }
        if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
            return res.status(400).json({ success: false, message: 'Price must be a valid positive number' });
        }
        const product = await Product.create({
            name:        name.trim(),
            price:       parseFloat(price),
            description: description ? description.trim() : '',
            stock:       parseInt(stock) || 999,
            available:   available !== false,
            image:       image || 'placeholder.jpg',
            imageData:   imageData || null,
            category:    category || 'other'
        });
        res.status(201).json({ success: true, product });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

// PUT /api/products/:id (admin)
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const { name, price, description, stock, image, imageData, category, available } = req.body;
        const update = {};
        if (name !== undefined)        update.name        = name.trim();
        if (price !== undefined)       update.price       = parseFloat(price);
        if (description !== undefined) update.description = description.trim();
        if (stock !== undefined)       update.stock       = parseInt(stock);
        if (image !== undefined)       update.image       = image || 'placeholder.jpg';
        if (imageData !== undefined)   update.imageData   = imageData || null;
        if (category !== undefined)    update.category    = category;
        if (available !== undefined)   update.available   = available;

        const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
        if (!product) return res.status(404).json({ success: false, message: 'Item not found' });
        res.json({ success: true, product });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// DELETE /api/products/:id (admin)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Item not found' });
        res.json({ success: true, message: 'Menu item deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
