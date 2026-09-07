const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const {
  postBookingReview,
  getWorkerPerformance,
  getMyPerformance,
  getCooperativePerformanceDistribution,
} = require('../controllers/reviewController');

router.use(requireAuth);

// Customer submits review for a booking
router.post('/bookings/:id/review', requireRole(['customer', 'cooperative_admin']), postBookingReview);

// Worker views their own performance metrics
router.get('/worker/my-performance', requireRole(['worker', 'cooperative_admin']), getMyPerformance);

// Cooperative Admin views specific worker performance & platform distribution
router.get('/workers/:id/performance', requireRole(['worker', 'cooperative_admin']), getWorkerPerformance);
router.get('/cooperative/performance-distribution', requireRole('cooperative_admin'), getCooperativePerformanceDistribution);

module.exports = router;
