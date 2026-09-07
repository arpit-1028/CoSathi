const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const {
  handleGeocode,
  handleReverseGeocode,
  getWorkerServiceArea,
  updateWorkerServiceArea,
  reportWorkerLocation,
  getBookingLiveTracking,
  simulateEnRouteRoute,
} = require('../controllers/geoController');

// Public / Authenticated Address & Geocoding Endpoints
router.post('/geocode', handleGeocode);
router.post('/reverse-geocode', handleReverseGeocode);

// Protected routes
router.use(requireAuth);

// Worker Service Area Management
router.get('/worker-service-area', requireRole(['worker', 'cooperative_admin']), getWorkerServiceArea);
router.put('/worker-service-area', requireRole(['worker', 'cooperative_admin']), updateWorkerServiceArea);
router.post('/worker-location', requireRole(['worker', 'cooperative_admin']), reportWorkerLocation);

// Privacy-guarded Live Route Tracking for assigned bookings
router.get('/bookings/:id/live-tracking', getBookingLiveTracking);
router.post('/bookings/:id/simulate-enroute', simulateEnRouteRoute);

module.exports = router;
