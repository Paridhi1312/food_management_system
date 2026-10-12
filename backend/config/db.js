const mongoose = require('mongoose');
const dns = require('dns');

// Use reliable DNS servers for Atlas SRV resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // fallback to system default
}

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('YOUR_USERNAME') || uri.includes('YOUR_PASSWORD') || uri.includes('YOUR_CLUSTER')) {
    console.error('================================================================');
    console.error('❌ MONGODB ATLAS CONFIGURATION REQUIRED');
    console.error('Missing or placeholder MONGODB_URI in backend/.env file!');
    console.error('Please configure your real MongoDB Atlas connection string:');
    console.error('MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/food_management_db?retryWrites=true&w=majority');
    console.error('================================================================');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'food_management_db',
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = true;
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host} / Database: ${conn.connection.name}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.error('❌ MongoDB Atlas Connection Error:', error.message);
    console.error('Suggestions:');
    console.error(' 1. Check IP Whitelist in Atlas Network Access (e.g. 0.0.0.0/0 for anywhere).');
    console.error(' 2. Verify Database User username and password.');
    console.error(' 3. Ensure cluster is active and URL is properly encoded.');
    return false;
  }
};

const getStatus = () => ({
  isConnected,
  dbName: mongoose.connection?.name || 'food_management_db',
  host: mongoose.connection?.host || null,
  readyState: mongoose.connection?.readyState || 0,
});

module.exports = { connectDB, getStatus };
