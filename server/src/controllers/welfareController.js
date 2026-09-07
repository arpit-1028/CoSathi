const {
  getWorkerInsurance,
  grantWorkerInsurance,
  getAllWorkerInsurances,
  disburseEmergencyAid,
  getWelfareOverview,
} = require('../services/welfareService');

// GET /api/cooperative/welfare/overview or /api/cooperative/welfare
const getWelfareSummary = async (req, res, next) => {
  try {
    const data = await getWelfareOverview();
    res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/cooperative/welfare/insurance
const getInsurances = async (req, res, next) => {
  try {
    const policies = await getAllWorkerInsurances(req.query);
    res.status(200).json({
      success: true,
      count: policies.length,
      policies,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/cooperative/welfare/insurance
const postGrantInsurance = async (req, res, next) => {
  try {
    const { workerId, ...policyData } = req.body;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'workerId is required.' });
    }

    const result = await grantWorkerInsurance(workerId, policyData, req.user);
    res.status(201).json({
      success: true,
      message: `Insurance policy granted/renewed successfully for worker. Premium subsidized from cooperative fund.`,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/cooperative/welfare/disburse
const postEmergencyDisbursement = async (req, res, next) => {
  try {
    const { workerId, amount, justification, benefitType } = req.body;
    if (!workerId || !amount) {
      return res.status(400).json({ success: false, message: 'workerId and amount are required.' });
    }

    const result = await disburseEmergencyAid(
      { workerId, amount, justification, benefitType },
      req.user
    );

    res.status(200).json({
      success: true,
      message: `Emergency assistance of ₹${amount} sanctioned successfully.`,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/worker/my-insurance
const getMyInsurance = async (req, res, next) => {
  try {
    const data = await getWorkerInsurance(req.user._id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWelfareSummary,
  getInsurances,
  postGrantInsurance,
  postEmergencyDisbursement,
  getMyInsurance,
};
