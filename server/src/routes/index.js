const express = require('express');
const router = express.Router();
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const cooperativeRoutes = require('./cooperativeRoutes');
const bookingRoutes = require('./bookingRoutes');
const aiRoutes = require('./aiRoutes');
const rateCardRoutes = require('./rateCardRoutes');
const geoRoutes = require('./geoRoutes');
const reviewRoutes = require('./reviewRoutes');
const welfareRoutes = require('./welfareRoutes');

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/cooperative', cooperativeRoutes);
router.use('/bookings', bookingRoutes);
router.use('/customer/bookings', bookingRoutes);
router.use('/worker/bookings', bookingRoutes);
router.use('/ai', aiRoutes);
router.use('/rate-card', rateCardRoutes);
router.use('/geo', geoRoutes);
router.use('/reviews', reviewRoutes);
router.use('/', reviewRoutes);
router.use('/', welfareRoutes);

module.exports = router;
