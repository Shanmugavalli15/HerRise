const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const submissionRoutes = require('./routes/submissions');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/she_can_foundation';

console.log('Connecting to MongoDB at:', mongoURI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in log
mongoose
  .connect(mongoURI)
  .then(() => console.log('MongoDB connection established successfully.'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.log('Please ensure your MongoDB service is running and the MONGO_URI in .env is correct.');
  });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'She Can Foundation backend is running' });
});

// Serve frontend build in production
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

app.get('*', (req, res) => {
  // If request starts with /api, it means API endpoint not found
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ message: 'API Endpoint not found' });
  }
  
  // Serve the React client index.html for all page refresh scenarios (SPA routing)
  res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Backend is running. Frontend build was not found (development mode).');
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
