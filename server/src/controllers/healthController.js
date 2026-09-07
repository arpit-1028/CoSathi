const mongoose = require('mongoose');

const getHealth = async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.status(200).json({
    success: true,
    message: 'CoSathi Backend API is operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      host: mongoose.connection.host || 'none',
      name: mongoose.connection.name || 'cosathi',
    },
    version: '1.0.0-phase1',
  });
};

module.exports = { getHealth };
