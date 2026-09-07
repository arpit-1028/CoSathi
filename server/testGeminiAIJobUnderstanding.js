const http = require('http');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

const request = (path, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, body });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
};

(async () => {
  console.log('=====================================================================');
  console.log('⭐ PHASE 9: GOOGLE GEMINI AI JOB UNDERSTANDING & EXTRACTION TEST ⭐');
  console.log('=====================================================================');

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Approved Task Codes Endpoint
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Testing Approved MongoDB Rate Card Knowledge Base ---');
    const codesRes = await request('/api/ai/task-codes', 'GET');
    assert(codesRes.status === 200, 'GET /api/ai/task-codes returned HTTP 200');
    assert(Array.isArray(codesRes.body.codes), 'Returns array of verified MongoDB task codes');
    assert(
      codesRes.body.codes.some((c) => c.code === 'TAP_REPLACEMENT'),
      'Verified TAP_REPLACEMENT exists in MongoDB knowledge base'
    );
    assert(
      codesRes.body.codes.some((c) => c.code === 'DRAIN_BLOCKAGE'),
      'Verified DRAIN_BLOCKAGE exists in MongoDB knowledge base'
    );

    // -------------------------------------------------------------------------
    // TEST 2: AI Feature 1 - Hinglish Customer Service Request Interpretation
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing AI Feature 1: Hinglish Customer Request Interpretation ---');
    const hinglishPrompt = 'Bathroom ka nal change karna hai aur sewage blockage bhi hai.';
    console.log(`  Input: "${hinglishPrompt}"`);

    const hinglishRes = await request('/api/ai/interpret-request', 'POST', {
      text: hinglishPrompt,
    });

    assert(hinglishRes.status === 200, 'POST /api/ai/interpret-request returned HTTP 200');
    const hData = hinglishRes.body.data;
    assert(Boolean(hData), 'Returned interpretation data object');
    assert(
      hData.serviceCategory === 'plumbing',
      `Identified serviceCategory as "plumbing" (Actual: "${hData.serviceCategory}")`
    );
    assert(Array.isArray(hData.tasks), 'Returns structured tasks array');

    const taskCodes = hData.tasks.map((t) => t.code);
    assert(
      taskCodes.includes('TAP_REPLACEMENT'),
      `Extracted task code TAP_REPLACEMENT (Codes: ${taskCodes.join(', ')})`
    );
    assert(
      taskCodes.includes('DRAIN_BLOCKAGE'),
      `Extracted task code DRAIN_BLOCKAGE (Codes: ${taskCodes.join(', ')})`
    );
    assert(
      hData.language === 'hi',
      `Detected language as Hindi/Hinglish (Actual: "${hData.language}")`
    );
    assert(
      hData.confidence >= 0.85,
      `Confidence is high (${hData.confidence} >= 0.85)`
    );
    assert(
      hData.price === undefined && hData.total === undefined,
      'Crucial Constraint: Gemini did NOT return any prices (Pricing belongs strictly to RateCard)'
    );

    // -------------------------------------------------------------------------
    // TEST 3: AI Feature 1 - Pure Devanagari Hindi Request
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing AI Feature 1: Pure Hindi (Devanagari) Interpretation ---');
    const hindiPrompt = 'कमरे का सीलिंग फैन बहुत धीमी गति से चल रहा है और गुनगुनाहट की आवाज़ आ रही है।';
    console.log(`  Input: "${hindiPrompt}"`);

    const hindiRes = await request('/api/ai/interpret-request', 'POST', {
      text: hindiPrompt,
    });

    assert(hindiRes.status === 200, 'Hindi request returned HTTP 200');
    const hiData = hindiRes.body.data;
    assert(
      hiData.serviceCategory === 'electrical',
      `Identified category as "electrical" (Actual: "${hiData.serviceCategory}")`
    );
    assert(
      hiData.tasks.some((t) => t.code === 'ELEC_FAN_REPAIR'),
      'Identified task ELEC_FAN_REPAIR from Hindi prompt'
    );
    assert(
      hiData.language === 'hi',
      `Detected Devanagari script as "hi" (Actual: "${hiData.language}")`
    );

    // -------------------------------------------------------------------------
    // TEST 4: AI Feature 1 - English Request Interpretation
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing AI Feature 1: English Request Interpretation ---');
    const englishPrompt = 'Need short circuit diagnosis because the MCB is tripping when the geyser is turned on.';
    console.log(`  Input: "${englishPrompt}"`);

    const engRes = await request('/api/ai/interpret-request', 'POST', {
      text: englishPrompt,
    });

    assert(engRes.status === 200, 'English request returned HTTP 200');
    const engData = engRes.body.data;
    assert(
      engData.serviceCategory === 'electrical',
      `Identified category as "electrical" (Actual: "${engData.serviceCategory}")`
    );
    assert(
      engData.tasks.some((t) => t.code === 'ELEC_MCB_FAULT'),
      'Identified task ELEC_MCB_FAULT from English prompt'
    );
    assert(
      engData.language === 'en',
      `Detected language as English (Actual: "${engData.language}")`
    );

    // -------------------------------------------------------------------------
    // TEST 5: AI Feature 1 - Unknown Task Code Validation & Flagging (NEEDS_REVIEW)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Server-Side Guardrail: Unknown Task Flagged as NEEDS_REVIEW ---');
    const unknownPrompt = 'Install a nuclear fusion reactor in the backyard and calibrate quantum laser.';
    console.log(`  Input: "${unknownPrompt}"`);

    const unknownRes = await request('/api/ai/interpret-request', 'POST', {
      text: unknownPrompt,
    });

    assert(unknownRes.status === 200, 'Unknown request handled with HTTP 200');
    const unkData = unknownRes.body.data;
    assert(
      unkData.tasks.some((t) => t.code === 'NEEDS_REVIEW'),
      `Server-side validation flagged unknown tasks as "NEEDS_REVIEW" (Codes: ${unkData.tasks.map((t) => t.code).join(', ')})`
    );

    // -------------------------------------------------------------------------
    // TEST 6: AI Feature 2 - Worker Completion Description Interpretation
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing AI Feature 2: Worker Completion Description ---');
    const workerReport = 'Purana bathroom tap remove karke naya tap lagaya aur drain ka blockage clear kiya.';
    console.log(`  Input: "${workerReport}"`);

    const completionRes = await request('/api/ai/interpret-completion', 'POST', {
      description: workerReport,
    });

    assert(completionRes.status === 200, 'POST /api/ai/interpret-completion returned HTTP 200');
    const compData = completionRes.body.data;
    assert(Array.isArray(compData.tasks), 'Returns structured completion tasks array');

    const compCodes = compData.tasks.map((t) => t.code);
    assert(
      compCodes.includes('TAP_REPLACEMENT'),
      `Identified completed TAP_REPLACEMENT from worker report (Codes: ${compCodes.join(', ')})`
    );
    assert(
      compCodes.includes('DRAIN_BLOCKAGE'),
      `Identified completed DRAIN_BLOCKAGE from worker report (Codes: ${compCodes.join(', ')})`
    );
    assert(
      Boolean(compData.summary),
      `Generated concise summary: "${compData.summary}"`
    );
    assert(
      compData.tasks.every((t) => typeof t.quantity === 'number' && t.quantity >= 1),
      'All completed tasks have valid quantities'
    );
    assert(
      compData.price === undefined && compData.total === undefined,
      'Worker completion does NOT set final price (Reserved strictly for RateCard reconciliation in Phase 10)'
    );

    // -------------------------------------------------------------------------
    // TEST 7: Input Validation & Edge Cases
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Testing Input Validation & Error Handling ---');
    const emptyRes = await request('/api/ai/interpret-request', 'POST', { text: '' });
    assert(emptyRes.status === 400, 'Empty text returns HTTP 400 Bad Request');

    const emptyCompRes = await request('/api/ai/interpret-completion', 'POST', { description: '   ' });
    assert(emptyCompRes.status === 400, 'Empty worker report returns HTTP 400 Bad Request');

    console.log('\n=====================================================================');
    console.log(`⭐ PHASE 9 TESTS COMPLETE: ${passedTests}/${totalTests} PASSED ⭐`);
    console.log('=====================================================================');

    process.exit(passedTests === totalTests ? 0 : 1);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
})();
