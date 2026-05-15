// seed.js - Insert initial products into MongoDB database
// Run with: node seed.js
require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
const mongoose = require('mongoose');

// Define Product Schema (temporary - will be moved to models/ later)
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    stock: { type: Number, default: 0 },
    image: { type: String },
    category: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// Product Data - 8 products for Crumbelle
const products = [
    {
        name: "Signature Coffee",
        price: 149,
        description: "Rich, aromatic blend to start your day right. Carefully roasted to bring out smooth chocolate and nutty notes.",
        stock: 45,
        image: "Signature-Coffee.jpg",
        category: "coffee"
    },
    {
        name: "Gourmet Burger",
        price: 249,
        description: "Juicy beef patty with fresh lettuce, tomatoes, onions, and our special signature sauce.",
        stock: 32,
        image: "Gourmet-Burger.jpg",
        category: "food"
    },
    {
        name: "Italian Pizza",
        price: 399,
        description: "Authentic Italian pizza with premium pepperoni, fresh mozzarella, bell peppers, and mushrooms.",
        stock: 18,
        image: "Italian-Pizza.jpg",
        category: "food"
    },
    {
        name: "Iced Caramel Macchiato",
        price: 179,
        description: "Smooth espresso combined with vanilla syrup, cold milk, and caramel drizzle over ice.",
        stock: 28,
        image: "Iced-Caramel-Macchiato.jpg",
        category: "coffee"
    },
    {
        name: "Chocolate Cake",
        price: 129,
        description: "Rich, moist chocolate cake layered with creamy chocolate frosting. Perfect for chocolate lovers!",
        stock: 15,
        image: "Chocolate-Cake.jpg",
        category: "desserts"
    },
    {
        name: "French Fries",
        price: 89,
        description: "Crispy golden fries made from premium potatoes. Served with your choice of dipping sauce.",
        stock: 50,
        image: "French-Fries.jpg",
        category: "food"
    },
    {
        name: "Matcha Latte",
        price: 159,
        description: "Premium Japanese matcha powder whisked with steamed milk. Earthy, sweet, and incredibly smooth.",
        stock: 22,
        image: "Matcha-Latte.jpg",
        category: "coffee"
    },
    {
        name: "Cheesecake",
        price: 149,
        description: "Creamy New York style cheesecake with a buttery graham cracker crust.",
        stock: 12,
        image: "Cheesecake.jpg",
        category: "desserts"
    },
    {
        name: "Nicka Maasim",
        price: 149,
        description: "Rich, aromatic black coffee with a bold and smooth finish. Perfectly brewed to energize your day.",
        stock: 30,
        image: "Nicka-Maasim.jpg",
        category: "coffee"
    }
];

// Connect to MongoDB and seed data
async function seedDatabase() {
    try {
        // Using your provided MongoDB URI
        const mongoURI = 'mongodb+srv://GroupProject:CrumBelle2026@cluster0.ewuovqj.mongodb.net/crumbelle?retryWrites=true&w=majority';
        
        console.log('🔄 Connecting to MongoDB...');
        console.log('📦 Database: crumbelle');
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB successfully');
        
        // Clear existing products
        await Product.deleteMany();
        console.log('🗑️ Cleared existing products');
        
        // Insert new products
        const inserted = await Product.insertMany(products);
        console.log(`✅ Inserted ${inserted.length} products`);
        
        // Display inserted products
        console.log('\n📋 Products inserted:');
        inserted.forEach(product => {
            console.log(`   - ${product.name} (₱${product.price}) | Stock: ${product.stock}`);
        });
        
        console.log('\n✨ Seeding completed successfully!');
        console.log('\n💡 Next steps:');
        console.log('   1. Run "nodemon server.js" to start the backend');
        console.log('   2. Open frontend products.html to see the products');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error seeding database:', error.message);
        
        // Common error solutions
        if (error.message.includes('ENOTFOUND')) {
            console.log('\n⚠️ Network error: Could not reach MongoDB Atlas');
            console.log('   Check your internet connection and try again.');
        } else if (error.message.includes('Authentication failed')) {
            console.log('\n⚠️ Authentication failed: Wrong username or password');
            console.log('   Check your MongoDB Atlas credentials.');
        } else if (error.message.includes('bad auth')) {
            console.log('\n⚠️ Authentication failed: Check your username and password in the URI');
        }
        
        process.exit(1);
    }
}

// Run the seed function
seedDatabase();