const {
  submitBookingReview,
  getWorkerPerformanceDetails,
} = require('../services/reviewService');
const { Review, WorkerPerformance, User } = require('../models');

/**
 * POST /api/bookings/:id/review
 * Customer leaves review & rating for completed booking
 */
const postBookingReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reviewData = req.body;

    const result = await submitBookingReview(id, req.user, reviewData);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully. Worker performance metrics updated.',
      review: result.review,
      workerPerformance: {
        averageRating: result.performance.averageRating,
        totalRatingsCount: result.performance.totalRatingsCount,
        complaintsCount: result.performance.complaintsCount,
        completionRatePercent: result.performance.completionRatePercent,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/cooperative/workers/:id/performance
 * Admin / Worker view detailed worker performance metrics and history
 */
const getWorkerPerformance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const performanceData = await getWorkerPerformanceDetails(id);

    res.status(200).json({
      success: true,
      data: performanceData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/worker/my-performance
 * Worker views their own performance dashboard
 */
const getMyPerformance = async (req, res, next) => {
  try {
    const performanceData = await getWorkerPerformanceDetails(req.user._id);

    res.status(200).json({
      success: true,
      data: performanceData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/cooperative/performance-distribution
 * Admin views cooperative-wide performance and fairness distribution
 */
const getCooperativePerformanceDistribution = async (req, res, next) => {
  try {
    const performances = await WorkerPerformance.find({})
      .populate('worker', 'name phone status')
      .sort({ averageRating: -1 });

    const totalWorkers = performances.length;
    const avgRating =
      totalWorkers > 0
        ? Math.round(
            (performances.reduce((sum, p) => sum + (p.averageRating || 5.0), 0) /
              totalWorkers) *
              100
          ) / 100
        : 5.0;

    const totalComplaints = performances.reduce(
      (sum, p) => sum + (p.complaintsCount || 0),
      0
    );

    res.status(200).json({
      success: true,
      summary: {
        totalWorkers,
        averageCooperativeRating: avgRating,
        totalComplaints,
      },
      distribution: performances.map((p) => ({
        workerId: p.worker?._id,
        workerName: p.worker?.name || 'Worker',
        averageRating: p.averageRating,
        totalRatingsCount: p.totalRatingsCount,
        lifetimeJobsCompleted: p.lifetimeJobsCompleted,
        fairDistributionScore: p.fairDistributionScore,
        complaintsCount: p.complaintsCount,
        completionRatePercent: p.completionRatePercent,
        cancellationRatePercent: p.cancellationRatePercent,
        noShowRatePercent: p.noShowRatePercent,
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  postBookingReview,
  getWorkerPerformance,
  getMyPerformance,
  getCooperativePerformanceDistribution,
};
