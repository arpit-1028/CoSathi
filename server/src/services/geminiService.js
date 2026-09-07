const { GoogleGenAI } = require('@google/genai');
const { RateCardItem, ServiceCategory } = require('../models');

// Initialize Google Gen AI client server-side if a valid API key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient = null;
const isLiveApiKey = apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here';

if (isLiveApiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
    console.log('[GeminiService] Initialized Google Gen AI client with live API key.');
  } catch (err) {
    console.warn('[GeminiService] Failed to initialize GoogleGenAI client:', err.message);
  }
} else {
  console.log('[GeminiService] Running with hybrid AI engine (Live API when key supplied + Deterministic Multi-lingual Semantic Fallback).');
}

/**
 * Language detection helper for Hindi, English, and Hinglish
 */
const detectLanguage = (text) => {
  if (!text) return 'en';
  // Devanagari unicode range \u0900-\u097F
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  if (hasDevanagari) return 'hi';

  const hinglishKeywords = [
    'karna', 'karo', 'hai', 'bhi', 'aur', 'ka', 'ki', 'ke', 'mein', 'se',
    'nal', 'pankha', 'chahiye', 'kariye', 'khatam', 'naya', 'purana', 'kar',
    'raha', 'rahi', 'saaf', 'theek', 'kamre', 'paani', 'chal', 'aawaz'
  ];
  const words = text.toLowerCase().split(/\s+/);
  const hinglishMatches = words.filter((w) => hinglishKeywords.includes(w));

  if (hinglishMatches.length >= 2) return 'hi'; // Treated as Hindi context
  return 'en';
};

/**
 * Fetch known valid task codes and categories from MongoDB RateCard
 */
const getMongoDBKnowledgeBase = async () => {
  try {
    const [rateCardItems, categories] = await Promise.all([
      RateCardItem.find({ isActive: true }).select('serviceCode title category standardRate').populate('category', 'slug name'),
      ServiceCategory.find({ isActive: true }).select('slug name'),
    ]);

    const taskCodeMap = new Map();
    rateCardItems.forEach((item) => {
      const code = item.serviceCode.toUpperCase();
      taskCodeMap.set(code, {
        serviceCode: code,
        titleEn: item.title?.en || code,
        titleHi: item.title?.hi || code,
        categorySlug: item.category?.slug || 'general',
        standardRate: item.standardRate,
        _id: item._id,
      });
    });

    const categorySlugs = new Set(categories.map((c) => c.slug.toLowerCase()));

    return { taskCodeMap, categorySlugs, rateCardItems, categories };
  } catch (err) {
    console.warn('[GeminiService] Could not fetch MongoDB knowledge base:', err.message);
    return {
      taskCodeMap: new Map(),
      categorySlugs: new Set(['plumbing', 'electrical', 'carpentry', 'cleaning', 'appliance-repair', 'painting', 'gardening']),
      rateCardItems: [],
      categories: [],
    };
  }
};

/**
 * Deterministic Multilingual Semantic Fallback Parser
 * Accurately parses Hindi, English, and Hinglish when Gemini API is offline or key unconfigured
 */
const fallbackSemanticParser = (text, knowledgeBase, isWorkerCompletion = false) => {
  const normalized = text.toLowerCase();
  const lang = detectLanguage(text);

  let detectedCategory = 'general';
  const extractedTasks = [];

  // 1. Category Detection
  if (
    /\b(nal|tap|pipe|leak|drain|flush|sewage|plumb|sink|faucet|basin)\b/i.test(normalized) ||
    /(नल|सिंक|पाइप|लीक|ड्रेन|नाली|सीवेज)/.test(normalized)
  ) {
    detectedCategory = 'plumbing';
  } else if (
    /\b(fan|pankha|switch|light|wire|short\s+circuit|mcb|humming|electric|capacitor)\b/i.test(normalized) ||
    /(फैन|पंखा|सीलिंग|बिजली|वायर|शॉर्ट|एमसीबी)/.test(normalized)
  ) {
    detectedCategory = 'electrical';
  } else if (
    /\b(air\s+conditioner|refrigerator|fridge|cooler|washing\s+machine)\b/i.test(normalized) ||
    /(एसी|फ्रिज|कूलर)/.test(normalized) ||
    /\bac\b/i.test(normalized)
  ) {
    detectedCategory = 'appliance-repair';
  } else if (
    /\b(door\s+lock|tala|darwaza|handle|carpenter|furniture|hinge)\b/i.test(normalized) ||
    /(दरवाजा|ताला|हैंडल|कारपेंटर|लकड़ी)/.test(normalized)
  ) {
    detectedCategory = 'carpentry';
  } else if (
    /\b(clean|cleaning|safai|deep\s+clean|kitchen|sofa)\b/i.test(normalized) ||
    /(सफाई|क्लीनिंग|रसोई)/.test(normalized)
  ) {
    detectedCategory = 'cleaning';
  }

  // 2. Granular Task Detection
  // Plumbing: Tap
  if (
    /\b(nal|tap|faucet|leak)\b/i.test(normalized) ||
    /(नल|लीक)/.test(normalized)
  ) {
    extractedTasks.push({
      code: 'TAP_REPLACEMENT',
      label: lang === 'hi' ? 'नल बदलना एवं लगाना' : 'Tap replacement',
    });
  }

  // Plumbing: Drain / Sewage
  if (
    /\b(drain|sewage|blockage|jam|naali|clog)\b/i.test(normalized) ||
    /(ड्रेन|सीवेज|नाली|जाम|ब्लॉकेज)/.test(normalized)
  ) {
    extractedTasks.push({
      code: 'DRAIN_BLOCKAGE',
      label: lang === 'hi' ? 'ड्रेन ब्लॉकेज एवं सीवेज सफाई' : 'Drain blockage clearance',
    });
  }

  // Plumbing: Pipe Cleaning
  if (
    /\b(pipe|pipeline|paip|pipe\s+cleaning)\b/i.test(normalized) ||
    /(पाइप|पाइपलाइन)/.test(normalized)
  ) {
    extractedTasks.push({
      code: 'PIPE_CLEANING',
      label: lang === 'hi' ? 'पाइप की सफाई एवं स्केल फ्लश' : 'Pipe cleaning & scale flush',
    });
  }

  // Electrical: Fan
  if (
    /\b(fan|pankha|capacitor|humming|slow)\b/i.test(normalized) ||
    /(फैन|पंखा|सीलिंग)/.test(normalized)
  ) {
    extractedTasks.push({
      code: 'ELEC_FAN_REPAIR',
      label: lang === 'hi' ? 'सीलिंग फैन मरम्मत / कैपेसिटर बदलाव' : 'Ceiling fan repair / capacitor replace',
    });
  }

  // Electrical: Switch / Socket
  if (
    /\b(switch|socket|board|button)\b/i.test(normalized) ||
    /(स्विच|सॉकेट|बोर्ड)/.test(normalized)
  ) {
    extractedTasks.push({
      code: 'ELEC_SWITCH_REP',
      label: lang === 'hi' ? 'स्विच / सॉकेट बदलना' : 'Switch / socket replacement',
    });
  }

  // Electrical: MCB
  if (
    /\b(mcb|trip|tripping|short\s+circuit)\b/i.test(normalized) ||
    /(एमसीबी|ट्रिप|शॉर्ट)/.test(normalized)
  ) {
    extractedTasks.push({
      code: 'ELEC_MCB_FAULT',
      label: lang === 'hi' ? 'एमसीबी ट्रिपिंग / शॉर्ट सर्किट जांच' : 'MCB tripping / short circuit diagnosis',
    });
  }

  // Carpentry: Lock
  if (
    /\b(door\s+lock|tala|handle|hinge)\b/i.test(normalized) ||
    /(ताला|हैंडल|कब्जा)/.test(normalized) ||
    (/\block\b/i.test(normalized) && !normalized.includes('block'))
  ) {
    extractedTasks.push({
      code: 'CARP_DOOR_LOCK',
      label: lang === 'hi' ? 'मुख्य दरवाजे का ताला / हैंडल लगाना' : 'Main door lock / handle installation',
    });
  }

  // Cleaning: Kitchen
  if (
    /\b(kitchen|degreasing)\b/i.test(normalized) ||
    /(रसोई|डीप\s+क्लीनिंग)/.test(normalized) ||
    (/\bdeep\b/i.test(normalized) && /\bclean\b/i.test(normalized))
  ) {
    extractedTasks.push({
      code: 'CLEAN_KITCHEN_DEEP',
      label: lang === 'hi' ? 'रसोई की संपूर्ण डीप क्लीनिंग' : 'Kitchen degreasing & deep clean',
    });
  }

  // Appliance: AC
  if (
    /\bair\s+conditioner\b/i.test(normalized) ||
    /\bjet\s+pump\b/i.test(normalized) ||
    /(एसी)/.test(normalized) ||
    /\bac\s+service\b/i.test(normalized)
  ) {
    extractedTasks.push({
      code: 'AC_SERVICE_GEN',
      label: lang === 'hi' ? 'स्प्लिट एसी फोम और सर्विसिंग' : 'Split AC foam & service',
    });
  }

  // Default fallback if no specific rule matched
  if (extractedTasks.length === 0) {
    extractedTasks.push({
      code: 'NEEDS_REVIEW',
      label: text.slice(0, 50),
    });
  }

  return {
    serviceCategory: detectedCategory,
    tasks: extractedTasks,
    language: lang,
    confidence: extractedTasks[0].code === 'NEEDS_REVIEW' ? 0.72 : 0.94,
  };
};

/**
 * AI FEATURE 1: Customer Service Request Interpretation
 * Strictly returns structured JSON with verified MongoDB task codes.
 * Unknown codes are flagged as NEEDS_REVIEW.
 * Never exposes API keys or returns prices.
 *
 * @param {string} text - Voice transcription or typed user request
 * @returns {Promise<Object>} Validated structured extraction
 */
const interpretCustomerRequest = async (text) => {
  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('Valid text input or voice transcript is required for interpretation.');
  }

  const cleanText = text.trim();
  const knowledgeBase = await getMongoDBKnowledgeBase();
  const validCodesList = Array.from(knowledgeBase.taskCodeMap.keys()).join(', ');
  const validCategoriesList = Array.from(knowledgeBase.categorySlugs).join(', ');

  let rawAiOutput = null;

  // Attempt live Google Gemini invocation if configured
  if (aiClient) {
    try {
      const prompt = `
You are the CoSathi AI Service Request Interpreter for Indian household & cooperative community services.
Analyze the following customer voice transcript or typed text in Hindi, English, or Hinglish:
"${cleanText}"

STRICT INSTRUCTIONS:
1. Identify the primary serviceCategory from this approved list: [${validCategoriesList}].
2. Identify granular individual tasks required.
3. Map tasks to the most fitting standardized task codes from this approved cooperative list: [${validCodesList}].
   If a task does NOT clearly match any code in the approved list, use "NEEDS_REVIEW" for its code.
4. Detect the language: "hi" (Hindi / Hinglish) or "en" (English).
5. Output a confidence score between 0.50 and 0.99.
6. DO NOT calculate, estimate, or return ANY prices or money amounts. Cooperative rate cards strictly govern all pricing.
7. DO NOT include conversational filler, markdown formatting, or explanations.

Return STRICT JSON only matching this schema:
{
  "serviceCategory": "plumbing",
  "tasks": [
    {
      "code": "TAP_REPLACEMENT",
      "label": "Tap replacement"
    }
  ],
  "language": "hi",
  "confidence": 0.94
}
`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const responseText = response.text?.() || response.text || '';
      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      rawAiOutput = JSON.parse(cleanJson);
    } catch (err) {
      console.warn('[GeminiService] Gemini API call failed or timed out. Falling back to local semantic engine:', err.message);
      rawAiOutput = null;
    }
  }

  // If live Gemini wasn't available or errored, use deterministic semantic parser
  if (!rawAiOutput || !Array.isArray(rawAiOutput.tasks)) {
    rawAiOutput = fallbackSemanticParser(cleanText, knowledgeBase, false);
  }

  // =========================================================================
  // SERVER-SIDE VALIDATION & NORMALIZATION AGAINST MONGODB RATE CARD
  // =========================================================================

  // 1. Validate Category
  let validatedCategory = 'general';
  if (rawAiOutput.serviceCategory && knowledgeBase.categorySlugs.has(rawAiOutput.serviceCategory.toLowerCase())) {
    validatedCategory = rawAiOutput.serviceCategory.toLowerCase();
  } else {
    // Attempt fallback category match
    for (const slug of knowledgeBase.categorySlugs) {
      if (cleanText.toLowerCase().includes(slug)) {
        validatedCategory = slug;
        break;
      }
    }
  }

  // 2. Validate Tasks against MongoDB RateCardItems
  const validatedTasks = [];

  for (const task of rawAiOutput.tasks || []) {
    const rawCode = (task.code || '').toUpperCase().trim();
    const taskLabel = task.label || task.title || 'Standard Cooperative Task';

    // Check if code exists in MongoDB knowledge base
    if (knowledgeBase.taskCodeMap.has(rawCode)) {
      const dbItem = knowledgeBase.taskCodeMap.get(rawCode);
      validatedTasks.push({
        code: dbItem.serviceCode,
        label: taskLabel,
        rateCardItemId: dbItem._id,
        isVerifiedRateCard: true,
      });
    } else {
      // Unknown code -> Mark as NEEDS_REVIEW
      validatedTasks.push({
        code: 'NEEDS_REVIEW',
        label: taskLabel,
        originalAttemptedCode: rawCode,
        isVerifiedRateCard: false,
        requiresManualReview: true,
      });
    }
  }

  // Ensure at least one task is returned
  if (validatedTasks.length === 0) {
    validatedTasks.push({
      code: 'NEEDS_REVIEW',
      label: cleanText.slice(0, 60),
      isVerifiedRateCard: false,
      requiresManualReview: true,
    });
  }

  const result = {
    serviceCategory: validatedCategory,
    tasks: validatedTasks.map((t) => ({
      code: t.code,
      label: t.label,
    })),
    language: rawAiOutput.language || detectLanguage(cleanText),
    confidence: Number(rawAiOutput.confidence) || 0.94,
    metadata: {
      rawInput: cleanText,
      verifiedTaskCount: validatedTasks.filter((t) => t.code !== 'NEEDS_REVIEW').length,
      needsReviewCount: validatedTasks.filter((t) => t.code === 'NEEDS_REVIEW').length,
    },
  };

  // Crucial Guarantee: Never return prices
  delete result.price;
  delete result.estimatedPrice;
  delete result.total;

  return result;
};

/**
 * AI FEATURE 2: Worker Completion Description
 * Interprets worker voice summary / typed text of work completed on site.
 * Validates task codes against MongoDB RateCardItem.
 * Unknown codes: NEEDS_REVIEW.
 * Gemini does NOT return final prices.
 *
 * @param {string} description - Worker voice summary or report
 * @returns {Promise<Object>} Structured completed tasks
 */
const interpretWorkerCompletion = async (description) => {
  if (!description || typeof description !== 'string' || !description.trim()) {
    throw new Error('Valid worker work completion description is required.');
  }

  const cleanDescription = description.trim();
  const knowledgeBase = await getMongoDBKnowledgeBase();
  const validCodesList = Array.from(knowledgeBase.taskCodeMap.keys()).join(', ');

  let rawAiOutput = null;

  if (aiClient) {
    try {
      const prompt = `
You are the CoSathi Worker Completion Report Extraction Engine.
Analyze the following worker job completion summary in Hindi, English, or Hinglish:
"${cleanDescription}"

STRICT INSTRUCTIONS:
1. Extract the specific work items completed.
2. Map each item to a standardized code from this approved cooperative list: [${validCodesList}].
   If an item does NOT match any code, assign code "NEEDS_REVIEW".
3. Extract quantity for each task item (default 1).
4. Summarize the completed work briefly.
5. DO NOT return or calculate prices. Cooperative rate cards govern all pricing.
6. DO NOT include conversational filler, markdown formatting, or explanations.

Return STRICT JSON only:
{
  "tasks": [
    {
      "code": "TAP_REPLACEMENT",
      "label": "Tap replacement",
      "quantity": 1
    },
    {
      "code": "DRAIN_BLOCKAGE",
      "label": "Drain blockage clearance",
      "quantity": 1
    }
  ],
  "summary": "Replaced bathroom tap and cleared drain blockage",
  "confidence": 0.95
}
`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const responseText = response.text?.() || response.text || '';
      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      rawAiOutput = JSON.parse(cleanJson);
    } catch (err) {
      console.warn('[GeminiService] Gemini worker report extraction failed. Falling back to local semantic parser:', err.message);
      rawAiOutput = null;
    }
  }

  // Fallback if needed
  if (!rawAiOutput || !Array.isArray(rawAiOutput.tasks)) {
    const semanticRes = fallbackSemanticParser(cleanDescription, knowledgeBase, true);
    rawAiOutput = {
      tasks: semanticRes.tasks.map((t) => ({ ...t, quantity: 1 })),
      summary: cleanDescription.slice(0, 100),
      confidence: semanticRes.confidence,
    };
  }

  // Server-side MongoDB validation
  const validatedTasks = [];

  for (const task of rawAiOutput.tasks || []) {
    const rawCode = (task.code || '').toUpperCase().trim();
    const taskLabel = task.label || task.title || 'Completed Cooperative Task';
    const quantity = Math.max(1, Number(task.quantity) || 1);

    if (knowledgeBase.taskCodeMap.has(rawCode)) {
      const dbItem = knowledgeBase.taskCodeMap.get(rawCode);
      validatedTasks.push({
        code: dbItem.serviceCode,
        label: taskLabel,
        quantity,
        rateCardItemId: dbItem._id,
        isVerifiedRateCard: true,
      });
    } else {
      validatedTasks.push({
        code: 'NEEDS_REVIEW',
        label: taskLabel,
        quantity,
        originalAttemptedCode: rawCode,
        isVerifiedRateCard: false,
        requiresManualReview: true,
      });
    }
  }

  if (validatedTasks.length === 0) {
    validatedTasks.push({
      code: 'NEEDS_REVIEW',
      label: cleanDescription.slice(0, 60),
      quantity: 1,
      isVerifiedRateCard: false,
      requiresManualReview: true,
    });
  }

  const result = {
    tasks: validatedTasks.map((t) => ({
      code: t.code,
      label: t.label,
      quantity: t.quantity,
    })),
    summary: rawAiOutput.summary || cleanDescription.slice(0, 120),
    confidence: Number(rawAiOutput.confidence) || 0.94,
    metadata: {
      rawDescription: cleanDescription,
      verifiedCount: validatedTasks.filter((t) => t.code !== 'NEEDS_REVIEW').length,
      needsReviewCount: validatedTasks.filter((t) => t.code === 'NEEDS_REVIEW').length,
    },
  };

  delete result.price;
  delete result.total;

  return result;
};

module.exports = {
  interpretCustomerRequest,
  interpretWorkerCompletion,
  detectLanguage,
  getMongoDBKnowledgeBase,
};
