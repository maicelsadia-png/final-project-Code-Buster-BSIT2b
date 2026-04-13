const mongoose = require('mongoose');
 
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};
 
module.exports = connectDB;
// In server.js:
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
 
const app = express();
connectDB();
 
app.use(cors());
app.use(express.json());
 
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});