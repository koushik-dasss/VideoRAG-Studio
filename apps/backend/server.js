// 🚨 CRITICAL: Force dotenv to find the file explicitly in the local directory
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const lectureRoutes = require('./routes/lectures');
const userRoutes    = require('./routes/users');

const app = express();

// Middleware
app.use(cors());           
app.use(express.json());   

// Connect to MongoDB Atlas
connectDB();

// Mount Routes
app.use('/api/lectures', lectureRoutes);
app.use('/api/users',    userRoutes);

app.get('/', (req, res) => {
  res.json({ message: '🎓 PrepStudent API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});