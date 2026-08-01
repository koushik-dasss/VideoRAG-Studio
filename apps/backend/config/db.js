const mongoose = require('mongoose');

// Hardcoded fallback ensures connection works even if your environment loader misbehaves
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://koushikdasmagnate2005_db_user:KoushikPass2026@cluster0.k726gfs.mongodb.net/videorag_db?appName=Cluster0";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
  }
};

module.exports = connectDB;
