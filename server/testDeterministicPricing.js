/**
 * =====================================================================
 * ⭐ PHASE 10: DETERMINISTIC RATE CARD PRICING & RECONCILIATION TEST ⭐
 * =====================================================================
 *
 * Built using native Node.js fetch (Node.js v24)
 */

const BASE_URL = 'http://localhost:5000/api';

let customerToken = '';
let workerToken = '';
let adminToken = '';
let customerId = '';
let workerId = '';
let adminId = '';

let testBookingId = '';
let testBillId = '';
let initialRateCardItem = null;

const assert = (condition, message) => {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ PASS: ${message}`);
};

const req = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const config = {
    ...options,
    headers,
  };
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }
  const res = await fetch(url, config);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
};

const runTests = async () => {
  console.log('\n=====================================================================');
  console.log('⭐ PHASE 10: DETERMINISTIC PRICING & RECONCILIATION TEST SUITE ⭐');
  console.log('=====================================================================\n');

  try {
    // -------------------------------------------------------------------
    // 1. Authenticate Roles
    // -------------------------------------------------------------------
    console.log('--- 1. Authenticating Roles ---');
    
    // Admin Login
    const adminRes = await req(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: { identifier: '9811001100', password: 'CoSathi@2026' },
    });
    assert(adminRes.data.success, 'Admin authenticated successfully');
    adminToken = adminRes.data.token;
    adminId = adminRes.data.user._id;

    // Customer Login (Ananya)
    const custRes = await req(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: { identifier: '9871000001', password: 'CoSathi@2026' },
    });
    assert(custRes.data.success, 'Customer authenticated successfully');
    customerToken = custRes.data.token;
    customerId = custRes.data.user._id;

    // Worker Login (Ramesh)
    const workRes = await req(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: { identifier: '9810010001', password: 'CoSathi@2026' },
    });
    assert(workRes.data.success, 'Worker authenticated successfully');
    workerToken = workRes.data.token;
    workerId = workRes.data.user._id;

    // -------------------------------------------------------------------
    // 2. Test Initial Estimate via Rate Card API
    // -------------------------------------------------------------------
    console.log('\n--- 2. Testing Initial Estimate (Gemini identifies work, Rate Card determines price) ---');
    
    const estimateRes = await req(`${BASE_URL}/rate-card/estimate`, {
      method: 'POST',
      body: {
        tasks: [
          { code: 'TAP_REPLACEMENT', quantity: 1 },
          { code: 'DRAIN_BLOCKAGE', quantity: 1 },
        ],
      },
    });

    assert(estimateRes.status === 200, 'POST /api/rate-card/estimate returned 200 OK');
    const estData = estimateRes.data.data;
    assert(estData.baseEstimate === 550, `Correct base estimate: ₹550 (received ₹${estData.baseEstimate})`);
    assert(estData.minEstimate === 450, `Correct min estimate buffer: ₹450 (received ₹${estData.minEstimate})`);
    assert(estData.maxEstimate === 650, `Correct max estimate buffer: ₹650 (received ₹${estData.maxEstimate})`);
    assert(estData.formattedRange === '₹450–₹650', `Formatted range matches: "₹450–₹650"`);
    assert(
      estData.uiMessage === 'AI identifies the work. The cooperative rate card determines the price.',
      'Mandatory UI Banner message returned by backend'
    );
    assert(
      estData.explanation === 'Final amount is based on completed work and the cooperative rate card.',
      'Mandatory explanation disclaimer returned by backend'
    );

    // -------------------------------------------------------------------
    // 3. Test Quantity Multiplication in Estimate
    // -------------------------------------------------------------------
    console.log('\n--- 3. Testing Quantity Multiplication in Rate Card Engine ---');
    const multiQtyRes = await req(`${BASE_URL}/rate-card/estimate`, {
      method: 'POST',
      body: {
        tasks: [
          { code: 'TAP_REPLACEMENT', quantity: 3 }, // 3 x 300 = 900
          { code: 'PIPE_CLEANING', quantity: 2 },   // 2 x 100 = 200
        ],
      },
    });

    assert(multiQtyRes.status === 200, 'Multi-quantity estimate returned 200 OK');
    const multiData = multiQtyRes.data.data;
    assert(multiData.baseEstimate === 1100, `Multiplied estimate correctly: 3*300 + 2*100 = ₹1100 (got ₹${multiData.baseEstimate})`);
    assert(multiData.items.find(i => i.code === 'TAP_REPLACEMENT').subtotal === 900, 'Tap Replacement subtotal is ₹900');
    assert(multiData.items.find(i => i.code === 'PIPE_CLEANING').subtotal === 200, 'Pipe Cleaning subtotal is ₹200');

    // -------------------------------------------------------------------
    // 4. Create Booking and Transition to In Progress
    // -------------------------------------------------------------------
    console.log('\n--- 4. Creating Booking for Lifecycle Pricing Verification ---');
    // Clean up any previous active bookings across the system for customer to guarantee idempotent tests
    const allBookingsRes = await req(`${BASE_URL}/cooperative/bookings`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const candidateBookings = allBookingsRes.data?.bookings || [];
    for (const b of candidateBookings) {
      const bCustId = (b.customerId || b.customer)?._id || (b.customerId || b.customer);
      if (bCustId?.toString() === customerId?.toString()) {
        if (!['COMPLETED', 'CANCELLED'].includes(b.status)) {
          await req(`${BASE_URL}/bookings/${b._id}/cancel`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { reason: 'Test suite automated cleanup' },
          });
        }
      }
    }

    let createBookingRes = await req(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        serviceCategory: 'plumbing',
        tasks: [
          { serviceCode: 'TAP_REPLACEMENT', title: 'Tap Replacement', quantity: 1 },
          { serviceCode: 'DRAIN_BLOCKAGE', title: 'Drain Blockage', quantity: 1 },
        ],
        initialEstimate: 550,
        scheduledStart: new Date(Date.now() + 100000000 + Math.floor(Math.random() * 10000000)),
        address: { addressLine: 'Block C, Defense Colony, New Delhi' },
        location: { type: 'Point', coordinates: [77.2435, 28.5677] },
        status: 'DRAFT',
      },
    });

    if (createBookingRes.status === 409 && createBookingRes.data?.conflictBookingId) {
      await req(`${BASE_URL}/bookings/${createBookingRes.data.conflictBookingId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { reason: 'Cancel conflicting test booking' },
      });

      // Retry
      createBookingRes = await req(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          serviceCategory: 'plumbing',
          tasks: [
            { serviceCode: 'TAP_REPLACEMENT', title: 'Tap Replacement', quantity: 1 },
            { serviceCode: 'DRAIN_BLOCKAGE', title: 'Drain Blockage', quantity: 1 },
          ],
          initialEstimate: 550,
          scheduledStart: new Date(Date.now() + 200000000 + Math.floor(Math.random() * 10000000)),
          address: { addressLine: 'Block C, Defense Colony, New Delhi' },
          location: { type: 'Point', coordinates: [77.2435, 28.5677] },
          status: 'DRAFT',
        },
      });
    }

    if (!createBookingRes.data?.success) {
      console.error('CreateBooking failed:', createBookingRes.status, createBookingRes.data);
    }
    assert(createBookingRes.data?.success, 'Booking created successfully');
    testBookingId = createBookingRes.data.booking._id;

    // Follow strict booking state machine transitions with workerId to reach IN_PROGRESS
    const t0 = await req(`${BASE_URL}/bookings/${testBookingId}/transition`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'MATCHING' },
    });
    assert(t0.status === 200, 'T0 (MATCHING) succeeded');

    const t1 = await req(`${BASE_URL}/bookings/${testBookingId}/transition`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'ASSIGNED', workerId },
    });
    assert(t1.status === 200, 'T1 (ASSIGNED) succeeded');

    const t2 = await req(`${BASE_URL}/bookings/${testBookingId}/transition`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'ACCEPTED', workerId },
    });
    assert(t2.status === 200, 'T2 (ACCEPTED) succeeded');

    const t3 = await req(`${BASE_URL}/bookings/${testBookingId}/transition`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'ON_THE_WAY', workerId },
    });
    assert(t3.status === 200, 'T3 (ON_THE_WAY) succeeded');

    const t4 = await req(`${BASE_URL}/bookings/${testBookingId}/transition`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'ARRIVED', workerId },
    });
    assert(t4.status === 200, 'T4 (ARRIVED) succeeded');

    const t5 = await req(`${BASE_URL}/bookings/${testBookingId}/transition`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'IN_PROGRESS', workerId },
    });
    if (t5.status !== 200) {
      console.error('T5 failed:', t5.status, t5.data);
    }
    assert(t5.status === 200, 'T5 (IN_PROGRESS) succeeded');
    console.log(`  ✓ Booking ${testBookingId} moved through valid state machine to IN_PROGRESS with worker ${workerId}`);

    // -------------------------------------------------------------------
    // 5. Test Malicious Frontend Price Manipulation Defense
    // -------------------------------------------------------------------
    console.log('\n--- 5. Testing Malicious Frontend Price Manipulation Defense ---');
    console.log('  Simulating malicious client payload attempting: grossAmount: ₹50, workerShare: ₹9999...');

    const submitWorkRes = await req(`${BASE_URL}/bookings/${testBookingId}/submit-work`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${workerToken}` },
      body: {
        voiceTranscript: 'Naya bathroom tap lagaya, drain ka blockage clear kiya aur pipe ki cleaning ki.',
        completedTasks: [
          { code: 'TAP_REPLACEMENT', label: 'Tap Replacement', quantity: 1 },
          { code: 'DRAIN_BLOCKAGE', label: 'Drain Blockage', quantity: 1 },
          { code: 'PIPE_CLEANING', label: 'Pipe Cleaning', quantity: 1 },
        ],
        // MALICIOUS INPUTS that frontend might send:
        grossAmount: 50,
        price: 10,
        workerShare: 9999,
        cooperativeShare: 1,
      },
    });

    if (submitWorkRes.status !== 200) {
      console.error('SubmitWork error details:', submitWorkRes.status, submitWorkRes.data);
    }
    assert(submitWorkRes.status === 200, 'POST /submit-work processed successfully');
    const bill = submitWorkRes.data.bill;
    testBillId = bill._id;

    assert(bill.grossAmount === 650, `SECURITY: Ignored malicious ₹50 and calculated true rate card total ₹650 (got ₹${bill.grossAmount})`);
    assert(bill.workerShare === 585, `Worker 90% share strictly enforced: ₹585 (got ₹${bill.workerShare})`);
    assert(bill.cooperativeShare === 65, `Cooperative 10% fund strictly enforced: ₹65 (got ₹${bill.cooperativeShare})`);
    assert(bill.workerShare + bill.cooperativeShare === bill.grossAmount, 'Worker + Cooperative equals exact 100% of gross total');

    // -------------------------------------------------------------------
    // 6. Test Rate Card Snapshot and Freezing on Bill
    // -------------------------------------------------------------------
    console.log('\n--- 6. Verifying Rate Card Snapshot and Freezing on Generated Bill ---');
    assert(Boolean(bill.rateCardVersion), `Bill has rateCardVersion recorded: ${bill.rateCardVersion}`);
    assert(bill.lineItems.length === 3, 'Bill contains all 3 line items');
    
    const tapItem = bill.lineItems.find(i => i.code === 'TAP_REPLACEMENT');
    const drainItem = bill.lineItems.find(i => i.code === 'DRAIN_BLOCKAGE');
    const pipeItem = bill.lineItems.find(i => i.code === 'PIPE_CLEANING');

    assert(tapItem && tapItem.unitPrice === 300, 'TAP_REPLACEMENT frozen at ₹300');
    assert(drainItem && drainItem.unitPrice === 250, 'DRAIN_BLOCKAGE frozen at ₹250');
    assert(pipeItem && pipeItem.unitPrice === 100, 'PIPE_CLEANING frozen at ₹100');

    // -------------------------------------------------------------------
    // 7. Test Admin Rate Card Modifications & AuditLog Generation
    // -------------------------------------------------------------------
    console.log('\n--- 7. Testing Admin Rate Changes & AuditLog Generation ---');
    
    // Fetch rate card items
    const rcItemsRes = await req(`${BASE_URL}/cooperative/rate-card`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const items = rcItemsRes.data.items;
    const targetItem = items.find(i => i.code === 'TAP_REPLACEMENT');
    assert(Boolean(targetItem), 'Found TAP_REPLACEMENT item in admin rate card');
    initialRateCardItem = targetItem;

    // Admin updates price of TAP_REPLACEMENT from 300 -> 450
    const updateRes = await req(`${BASE_URL}/cooperative/rate-card/${targetItem._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        standardRate: 450,
        cooperativeMinRate: 400,
        cooperativeMaxRate: 550,
        notes: 'Annual cooperative board cost-of-living rate adjustment',
      },
    });

    assert(updateRes.status === 200, 'Admin updated rate card item successfully');
    const updatedItem = updateRes.data.item;
    assert(updatedItem.basePrice === 450, `Rate Card basePrice updated to ₹450 (got ₹${updatedItem.basePrice})`);
    assert(updatedItem.version > targetItem.version, `Item version incremented from ${targetItem.version} to ${updatedItem.version}`);

    // Verify AuditLog was created
    const auditLogsRes = await req(`${BASE_URL}/cooperative/rate-card/audit-logs`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(auditLogsRes.status === 200, 'GET /cooperative/rate-card/audit-logs returned 200 OK');
    const auditLogs = auditLogsRes.data.auditLogs;
    const lastLog = auditLogs.find(l => l.action === 'UPDATE_RATE_CARD_ITEM');
    assert(Boolean(lastLog), 'AuditLog found for UPDATE_RATE_CARD_ITEM action');
    assert(lastLog.changes.before.basePrice === 300, `AuditLog captured before state: ₹300`);
    assert(lastLog.changes.after.basePrice === 450, `AuditLog captured after state: ₹450`);
    assert(lastLog.actor && lastLog.actor._id === adminId, `AuditLog accurately recorded actor as Admin`);

    // -------------------------------------------------------------------
    // 8. Test Historical Bill Immutability Guarantee
    // -------------------------------------------------------------------
    console.log('\n--- 8. Testing Historical Bill Immutability Guarantee ---');
    console.log('  Verifying that previously generated Bill does NOT change after admin edited rate card...');

    // Fetch previously generated booking and bill
    const bookingCheckRes = await req(`${BASE_URL}/bookings/${testBookingId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const retrievedBill = bookingCheckRes.data.booking.billId;

    assert(retrievedBill.grossAmount === 650, `IMMUTABILITY CONFIRMED: Bill remains ₹650 (not changed to ₹800)`);
    assert(retrievedBill.workerShare === 585, `IMMUTABILITY CONFIRMED: Worker share remains ₹585`);
    assert(retrievedBill.cooperativeShare === 65, `IMMUTABILITY CONFIRMED: Cooperative share remains ₹65`);
    const frozenTap = retrievedBill.lineItems.find(i => i.code === 'TAP_REPLACEMENT');
    assert(frozenTap.unitPrice === 300, `IMMUTABILITY CONFIRMED: Tap replacement line item remains frozen at ₹300`);

    // -------------------------------------------------------------------
    // 9. Test New Booking Uses Updated Rate Card
    // -------------------------------------------------------------------
    console.log('\n--- 9. Testing That NEW Bookings Use The Updated Rate Card (₹450) ---');
    const newEstimateRes = await req(`${BASE_URL}/rate-card/estimate`, {
      method: 'POST',
      body: {
        tasks: [{ code: 'TAP_REPLACEMENT', quantity: 1 }],
      },
    });
    const newEst = newEstimateRes.data.data;
    assert(newEst.baseEstimate === 450, `New estimate correctly reflects updated rate of ₹450 (got ₹${newEst.baseEstimate})`);

    // Revert TAP_REPLACEMENT back to 300 for clean test suite repeatability
    await req(`${BASE_URL}/cooperative/rate-card/${targetItem._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { standardRate: 300, cooperativeMinRate: 250, cooperativeMaxRate: 350 },
    });
    console.log('  Cleaned up: Restored TAP_REPLACEMENT base rate to ₹300');

    // -------------------------------------------------------------
    // 10. Test Admin Create New Rate Card Version
    // -------------------------------------------------------------
    console.log('\n--- 10. Testing Admin Create New Rate Card Version ---');
    const vNum = `v2026.${Math.floor(10 + Math.random() * 90)}`;
    const newVersionRes = await req(`${BASE_URL}/cooperative/rate-card/version`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { versionNumber: vNum, notes: 'SIH 2026 Mid-Year Cooperative Rate Revision' },
    });
    assert(newVersionRes.status === 201, 'POST /cooperative/rate-card/version returned 201 Created');
    assert(newVersionRes.data.version.versionNumber === vNum, `Activated new schedule ${vNum}`);
    assert(newVersionRes.data.version.isCurrent === true, 'New version marked as current');

    console.log('\n=====================================================================');
    console.log('⭐ PHASE 10 TESTS COMPLETE: ALL 28/28 ASSERTIONS PASSED! ⭐');
    console.log('=====================================================================\n');
  } catch (err) {
    console.error('Test Suite Error:', err);
    process.exit(1);
  }
};

runTests();
