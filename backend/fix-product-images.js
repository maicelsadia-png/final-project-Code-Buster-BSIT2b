// fix-product-images.js
// Run once: node fix-product-images.js
// Reads every product whose imageData is null but has an /uploads/ image file,
// converts the file to base64, and saves it back to MongoDB.

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./models/Product');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const products = await Product.find({ imageData: null });
    console.log(`Found ${products.length} products without imageData`);

    for (const product of products) {
        if (product.image && product.image.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, 'uploads', path.basename(product.image));
            if (fs.existsSync(filePath)) {
                const ext = path.extname(filePath).toLowerCase().replace('.', '');
                const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
                           : ext === 'png' ? 'image/png'
                           : ext === 'webp' ? 'image/webp'
                           : 'image/jpeg';
                const base64 = fs.readFileSync(filePath).toString('base64');
                product.imageData = `data:${mime};base64,${base64}`;
                await product.save();
                console.log(`✅ Fixed: ${product.name}`);
            } else {
                console.log(`⚠️  File not found for: ${product.name} (${product.image})`);
            }
        }
    }

    await mongoose.disconnect();
    console.log('Done.');
}

run().catch(err => { console.error(err); process.exit(1); });
