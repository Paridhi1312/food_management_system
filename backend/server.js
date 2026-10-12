const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB, getStatus } = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health & Atlas status check
app.get('/api/health', (req, res) => {
  const status = getStatus();
  res.json({
    status: status.isConnected ? 'CONNECTED' : 'DISCONNECTED',
    database: status.dbName,
    host: status.host,
    readyState: status.readyState,
    message: status.isConnected
      ? 'Successfully connected to MongoDB Atlas Cloud Database'
      : 'Not connected to MongoDB Atlas. Please configure MONGODB_URI in backend/.env',
  });
});

// Mount Routes
const apiRoutes = require('./routes/apiRoutes');
const advancedRoutes = require('./routes/advancedRoutes');

app.use('/api', apiRoutes);
app.use('/api', advancedRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// Start Server & Connect to DB
const startServer = async () => {
  // Connect to Atlas
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Food Management System Server running on http://localhost:${PORT}`);
  });
};

startServer();

module.exports = app;
