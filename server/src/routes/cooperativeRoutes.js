const express = require('express');
const router = express.Router();

const {
  getOverview,
  getWorkers,
  updateWorkerStatus,
  getRateCard,
  addRateCardItem,
  updateRateCardItem,
  createRateCardVersion,
  getRateCardAuditLogs,
  toggleRateCardItemStatus,
  getBookings,
  getForecast,
} = require('../controllers/cooperativeController');

const {
  getFinanceSummary,
  getFinanceLedger,
} = require('../controllers/financeController');

const {
  getWelfareSummary,
  getInsurances,
  postGrantInsurance,
  postEmergencyDisbursement,
} = require('../controllers/welfareController');

const {
  getDisputesList,
  getDisputeById,
  postResolveDispute,
} = require('../controllers/disputeController');

const {
  getForecastData,
  recalculateForecast,
  seedForecastHistory,
} = require('../controllers/forecastController');

const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// Guard all cooperative admin endpoints for 'cooperative_admin' role
router.use(requireAuth);
router.use(requireRole('cooperative_admin'));

// Overview & Workers
router.get('/overview', getOverview);
router.get('/workers', getWorkers);
router.put('/workers/:id/status', updateWorkerStatus);

// Rate Card Management
router.get('/rate-card', getRateCard);
router.post('/rate-card', addRateCardItem);
router.post('/rate-card/version', createRateCardVersion);
router.get('/rate-card/audit-logs', getRateCardAuditLogs);
router.put('/rate-card/:id', updateRateCardItem);
router.put('/rate-card/:id/status', toggleRateCardItemStatus);

// Bookings
router.get('/bookings', getBookings);

// Finance & 5-Bucket Fund
router.get('/finance', getFinanceSummary);
router.get('/finance/summary', getFinanceSummary);
router.get('/finance/ledger', getFinanceLedger);

// Worker Welfare & Insurance
router.get('/welfare', getWelfareSummary);
router.get('/welfare/overview', getWelfareSummary);
router.get('/welfare/insurance', getInsurances);
router.post('/welfare/insurance', postGrantInsurance);
router.post('/welfare/disburse', postEmergencyDisbursement);

// Disputes Arbitration Panel
router.get('/disputes', getDisputesList);
router.get('/disputes/:id', getDisputeById);
router.post('/disputes/:id/resolve', postResolveDispute);

// Demand Forecast & Workforce Allocation Engine
router.get('/forecast', getForecastData);
router.post('/forecast/recalculate', recalculateForecast);
router.post('/forecast/seed-history', seedForecastHistory);

module.exports = router;
