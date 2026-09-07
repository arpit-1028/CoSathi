const {
  interpretCustomerRequest,
  interpretWorkerCompletion,
  getMongoDBKnowledgeBase,
} = require('../services/geminiService');

/**
 * POST /api/ai/interpret-request
 * Customer Service Request Interpretation (Feature 1)
 * Takes voice transcription or typed text (Hindi, English, Hinglish).
 * Returns strict JSON with serviceCategory, tasks, language, confidence.
 */
const interpretRequest = async (req, res, next) => {
  try {
    const { text, transcription, category } = req.body;
    const inputContent = text || transcription;

    if (!inputContent || !inputContent.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Text or voice transcript is required for AI interpretation.',
      });
    }

    const interpretation = await interpretCustomerRequest(inputContent, category);

    res.status(200).json({
      success: true,
      data: interpretation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/interpret-completion
 * Worker Completion Description Interpretation (Feature 2)
 * Takes voice summary or typed work report.
 * Returns validated completed tasks. Unknown codes are flagged as NEEDS_REVIEW.
 */
const interpretCompletion = async (req, res, next) => {
  try {
    const { description, voiceReport } = req.body;
    const inputContent = description || voiceReport;

    if (!inputContent || !inputContent.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Work description or voice report is required for completion interpretation.',
      });
    }

    const completionReport = await interpretWorkerCompletion(inputContent);

    res.status(200).json({
      success: true,
      data: completionReport,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ai/task-codes
 * Returns approved rate card task codes and categories currently in MongoDB
 */
const getApprovedTaskCodes = async (req, res, next) => {
  try {
    const knowledgeBase = await getMongoDBKnowledgeBase();
    const codes = Array.from(knowledgeBase.taskCodeMap.values());
    const categories = Array.from(knowledgeBase.categorySlugs);

    res.status(200).json({
      success: true,
      categories,
      codes: codes.map((c) => ({
        code: c.serviceCode,
        titleEn: c.titleEn,
        titleHi: c.titleHi,
        category: c.categorySlug,
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  interpretRequest,
  interpretCompletion,
  getApprovedTaskCodes,
};
