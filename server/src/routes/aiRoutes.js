const express = require('express');
const router = express.Router();
const {
  interpretRequest,
  interpretCompletion,
  getApprovedTaskCodes,
} = require('../controllers/aiController');

// Public or session-based interpretation of customer service requirement
router.post('/interpret-request', interpretRequest);

// Worker work completion interpretation
router.post('/interpret-completion', interpretCompletion);

// List of currently approved MongoDB task codes
router.get('/task-codes', getApprovedTaskCodes);

module.exports = router;
