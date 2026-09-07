const {
  createDispute,
  resolveDisputeByAdmin,
  listDisputes,
  getDisputeDetails,
} = require('../services/disputeService');

// POST /api/bookings/:id/dispute (Customer raises dispute)
const postCreateDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await createDispute(id, req.user, req.body);
    res.status(201).json({
      success: true,
      message: 'Dispute submitted. Evidence compiled and queued for human cooperative arbitration.',
      dispute: result.dispute,
      aiEvidenceSummary: result.aiEvidenceSummary,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/cooperative/disputes (Admin lists disputes)
const getDisputesList = async (req, res, next) => {
  try {
    const disputes = await listDisputes(req.query);
    res.status(200).json({
      success: true,
      count: disputes.length,
      disputes,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/cooperative/disputes/:id (Admin inspects dispute & evidence pack)
const getDisputeById = async (req, res, next) => {
  try {
    const dispute = await getDisputeDetails(req.params.id);
    res.status(200).json({
      success: true,
      dispute,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/cooperative/disputes/:id/resolve (Admin executes decision)
const postResolveDispute = async (req, res, next) => {
  try {
    const result = await resolveDisputeByAdmin(req.params.id, req.body, req.user);
    res.status(200).json({
      success: true,
      message: result.message,
      dispute: result.dispute,
      auditLog: result.auditLog,
      refundResult: result.refundResult,
      workerStatusUpdated: result.workerStatusUpdated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  postCreateDispute,
  getDisputesList,
  getDisputeById,
  postResolveDispute,
};
