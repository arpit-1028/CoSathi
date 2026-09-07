const express = require('express');
const router = express.Router();
const { getMyInsurance } = require('../controllers/welfareController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

router.get('/worker/my-insurance', requireAuth, requireRole('worker'), getMyInsurance);

module.exports = router;
