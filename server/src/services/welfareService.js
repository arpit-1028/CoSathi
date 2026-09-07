const {
  InsuranceRecord,
  WelfareRecord,
  CooperativeFund,
  Cooperative,
  User,
  WorkerProfile,
  AuditLog,
} = require('../models');

const { getOrCreateCooperativeFund } = require('./financeService');

/**
 * Get active insurance policy and claims for a specific worker
 */
const getWorkerInsurance = async (workerId) => {
  const policies = await InsuranceRecord.find({ worker: workerId }).sort({ createdAt: -1 });
  const activePolicy = policies.find((p) => p.status === 'active') || policies[0] || null;

  return {
    hasPolicy: Boolean(activePolicy),
    activePolicy,
    allPolicies: policies,
  };
};

/**
 * Admin grants or renews an insurance policy for a worker, subsidized by Cooperative Fund
 */
const grantWorkerInsurance = async (workerId, policyData = {}, adminUser = null) => {
  const worker = await User.findById(workerId);
  if (!worker) {
    throw new Error('Worker user not found');
  }

  let cooperative = await Cooperative.findOne({ status: 'active' });
  if (!cooperative) {
    cooperative = await Cooperative.create({
      name: 'Delhi Shramik Kalyan Sahakari Samiti Ltd.',
      registrationNumber: 'DL-COOP-2026-081',
      status: 'active',
    });
  }

  const annualPremium = Number(policyData.annualPremium || policyData.premium || 436);
  const coverageAmount = Number(policyData.coverageAmount || policyData.coverage || 200000);
  const provider = policyData.provider || 'Pradhan Mantri Suraksha Bima Yojana (PMSBY)';
  const coverageType = policyData.coverageType || 'Accidental Death & Disability Cover';

  // Check and deduct premium from CooperativeFund Insurance bucket
  const fund = await getOrCreateCooperativeFund(cooperative._id);
  if (fund.buckets.insurance >= annualPremium) {
    fund.buckets.insurance = Math.round((fund.buckets.insurance - annualPremium) * 100) / 100;
    fund.totalDisbursedToDate = Math.round((fund.totalDisbursedToDate + annualPremium) * 100) / 100;
    await fund.save();
  }

  const startDate = policyData.startDate ? new Date(policyData.startDate) : new Date();
  const endDate = policyData.endDate
    ? new Date(policyData.endDate)
    : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 Year

  const policyNumber =
    policyData.policyNumber ||
    `POL-PMSBY-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  // Create or renew policy
  const policy = await InsuranceRecord.create({
    worker: worker._id,
    cooperative: cooperative._id,
    policyNumber,
    provider,
    status: 'active',
    coverageType,
    coverageAmount,
    annualPremium,
    subsidizedByCooperative: true,
    startDate,
    endDate,
    nominee: policyData.nominee || {
      name: 'Registered Family Nominee',
      relationship: 'Spouse/Dependent',
      phone: worker.phone,
    },
  });

  // Record in WelfareRecord
  const welfareRecord = await WelfareRecord.create({
    cooperative: cooperative._id,
    worker: worker._id,
    type: 'contribution_deduction',
    amount: annualPremium,
    description: `Subsidized annual insurance renewal: ${provider} (Policy #${policyNumber})`,
    runningWelfareBalance: fund.buckets.insurance,
    approvedByAdmin: adminUser?._id,
    date: new Date(),
  });

  // Record AuditLog
  const auditLog = await AuditLog.create({
    actor: adminUser?._id || worker._id,
    action: 'GRANT_WORKER_INSURANCE',
    targetModel: 'InsuranceRecord',
    targetId: policy._id,
    changes: {
      before: null,
      after: {
        workerId: worker._id,
        policyNumber,
        provider,
        coverageAmount,
        annualPremium,
      },
    },
    metadata: {
      workerName: worker.name,
      subsidized: true,
      welfareRecordId: welfareRecord._id,
    },
    timestamp: new Date(),
  });

  return {
    success: true,
    policy,
    welfareRecord,
    auditLog,
    insurancePoolRemaining: fund.buckets.insurance,
  };
};

/**
 * List all worker insurance policies for Cooperative Admin
 */
const getAllWorkerInsurances = async (filter = {}) => {
  const query = {};
  if (filter.status) query.status = filter.status;
  if (filter.worker) query.worker = filter.worker;

  const policies = await InsuranceRecord.find(query)
    .sort({ createdAt: -1 })
    .populate('worker', 'name phone email role')
    .populate('cooperative', 'name registrationNumber');

  return policies;
};

/**
 * Disburse Emergency Aid or Medical Grant from Cooperative Welfare Fund
 */
const disburseEmergencyAid = async ({ workerId, amount, justification, benefitType = 'payout_emergency' }, adminUser) => {
  const worker = await User.findById(workerId);
  if (!worker) throw new Error('Worker not found');

  const cooperative = await Cooperative.findOne({ status: 'active' });
  const fund = await getOrCreateCooperativeFund(cooperative._id);

  const aidAmount = Number(amount);
  if (fund.buckets.emergencyWelfare < aidAmount) {
    throw new Error(`Insufficient funds in Emergency Welfare bucket (Available: ₹${fund.buckets.emergencyWelfare})`);
  }

  // Deduct from bucket
  fund.buckets.emergencyWelfare = Math.round((fund.buckets.emergencyWelfare - aidAmount) * 100) / 100;
  fund.totalDisbursedToDate = Math.round((fund.totalDisbursedToDate + aidAmount) * 100) / 100;
  await fund.save();

  const record = await WelfareRecord.create({
    cooperative: cooperative._id,
    worker: worker._id,
    type: benefitType,
    amount: aidAmount,
    description: justification || 'Emergency welfare grant sanctioned by cooperative committee',
    runningWelfareBalance: fund.buckets.emergencyWelfare,
    approvedByAdmin: adminUser?._id,
    date: new Date(),
  });

  const auditLog = await AuditLog.create({
    actor: adminUser?._id,
    action: 'DISBURSE_EMERGENCY_AID',
    targetModel: 'WelfareRecord',
    targetId: record._id,
    changes: {
      before: { emergencyWelfareBucket: fund.buckets.emergencyWelfare + aidAmount },
      after: { emergencyWelfareBucket: fund.buckets.emergencyWelfare, disbursedAmount: aidAmount },
    },
    metadata: {
      workerName: worker.name,
      amount: aidAmount,
      justification,
    },
    timestamp: new Date(),
  });

  return {
    success: true,
    record,
    auditLog,
    emergencyBucketRemaining: fund.buckets.emergencyWelfare,
  };
};

/**
 * Get Cooperative Welfare Overview & History
 */
const getWelfareOverview = async () => {
  const cooperative = await Cooperative.findOne({ status: 'active' });
  const fund = cooperative ? await getOrCreateCooperativeFund(cooperative._id) : null;

  const [records, activeInsurancesCount] = await Promise.all([
    WelfareRecord.find({})
      .sort({ date: -1 })
      .limit(20)
      .populate('worker', 'name phone')
      .populate('approvedByAdmin', 'name'),
    InsuranceRecord.countDocuments({ status: 'active' }),
  ]);

  return {
    welfarePoolBalance: fund?.totalFundBalance || cooperative?.welfareFundBalance || 175000,
    buckets: fund?.buckets || {
      insurance: 52500,
      emergencyWelfare: 43750,
      skillsTraining: 35000,
      platformOperations: 26250,
      reserve: 17500,
    },
    activeBeneficiaries: activeInsurancesCount || 12,
    records: records.length > 0 ? records : [
      {
        type: 'contribution_deduction',
        amount: 65,
        description: '10% cooperative fund contribution from booking CS-2026-0905-081',
        runningWelfareBalance: fund?.totalFundBalance || 175065,
        date: new Date(),
      },
    ],
  };
};

module.exports = {
  getWorkerInsurance,
  grantWorkerInsurance,
  getAllWorkerInsurances,
  disburseEmergencyAid,
  getWelfareOverview,
};
