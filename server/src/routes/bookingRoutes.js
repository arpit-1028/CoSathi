const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getWorkerBookings,
  getWorkerActiveBooking,
  acceptBooking,
  declineBooking,
  startEnRoute,
  reportArrived,
  startWork,
  submitWorkReport,
  approveAndPay,
  raiseDispute,
  performTransition,
  matchBooking,
  getBookingEstimate,
  demoAcceptBooking,
} = require('../controllers/bookingController');
const {
  getBookingLiveTracking,
  simulateEnRouteRoute,
} = require('../controllers/geoController');

// Allow public/customer estimation
router.post('/estimate', getBookingEstimate);

// All booking operations require an active JWT session
router.use(requireAuth);

// Customer operations
router.post('/', createBooking);
router.get('/my', getMyBookings);
router.post('/:id/match', matchBooking);

// Worker operations
router.get('/worker/assigned', requireRole(['worker', 'cooperative_admin']), getWorkerBookings);
router.get('/worker/active', requireRole(['worker', 'cooperative_admin']), getWorkerActiveBooking);
router.get('/assigned', requireRole(['worker', 'cooperative_admin']), getWorkerBookings);
router.get('/active', requireRole(['worker', 'cooperative_admin']), getWorkerActiveBooking);

// Individual booking lifecycle operations (Access validated inside controller)
router.get('/:id', getBookingById);
router.get('/:id/live-tracking', getBookingLiveTracking);
router.post('/:id/simulate-enroute', simulateEnRouteRoute);
router.post('/:id/cancel', cancelBooking);
router.post('/:id/pay', approveAndPay);
router.post('/:id/dispute', raiseDispute);
router.post('/:id/transition', performTransition);
router.post('/:id/demo-accept', demoAcceptBooking);

// Worker lifecycle actions
router.post('/:id/accept', requireRole(['worker', 'cooperative_admin']), acceptBooking);
router.post('/:id/decline', requireRole(['worker', 'cooperative_admin']), declineBooking);
router.post('/:id/on-the-way', requireRole(['worker', 'cooperative_admin']), startEnRoute);
router.post('/:id/arrived', requireRole(['worker', 'cooperative_admin']), reportArrived);
router.post('/:id/start-work', requireRole(['worker', 'cooperative_admin']), startWork);
router.post('/:id/submit-work', requireRole(['worker', 'cooperative_admin']), submitWorkReport);

module.exports = router;
