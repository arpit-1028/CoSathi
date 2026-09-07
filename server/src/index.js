const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { connectDB } = require('./config/db');
const { initSocket } = require('./socket');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

const {
  mongoSanitize,
  generalApiRateLimiter,
  securityHeaders,
} = require('./middleware/securityMiddleware');

// Security Middleware
app.use(securityHeaders);
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize);
app.use('/api', generalApiRateLimiter);

// Mount API Routes
app.use('/api', routes);

// Error Handler
app.use(errorHandler);

// Port setup
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect Database
    await connectDB();

    // Initialize Socket.io
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`[Server] CoSathi Backend Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`[Server] API Health check available at: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('[Server] Fatal error during startup:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server };
