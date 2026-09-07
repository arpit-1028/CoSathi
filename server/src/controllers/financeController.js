const {
  getCooperativeFinancialOverview,
  getLedgerTransactions,
} = require('../services/financeService');

// GET /api/cooperative/finance/summary or /api/cooperative/finance
const getFinanceSummary = async (req, res, next) => {
  try {
    const data = await getCooperativeFinancialOverview();
    const ledger = await getLedgerTransactions({}, 20, 0);

    res.status(200).json({
      success: true,
      ...data,
      transactions: ledger.transactions,
      totalTransactions: ledger.totalCount,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/cooperative/finance/ledger
const getFinanceLedger = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 50);
    const skip = Number(req.query.skip || 0);
    const result = await getLedgerTransactions(req.query, limit, skip);

    res.status(200).json({
      success: true,
      count: result.transactions.length,
      totalCount: result.totalCount,
      transactions: result.transactions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFinanceSummary,
  getFinanceLedger,
};
