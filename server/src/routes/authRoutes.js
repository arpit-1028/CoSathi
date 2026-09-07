const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateLanguage,
  logout,
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

const { authRateLimiter, guardRegistrationRole } = require('../middleware/securityMiddleware');

router.post('/register', authRateLimiter, guardRegistrationRole, register);
router.post('/login', authRateLimiter, login);
router.get('/me', requireAuth, getMe);
router.put('/language', requireAuth, updateLanguage);
router.post('/logout', logout);

module.exports = router;
