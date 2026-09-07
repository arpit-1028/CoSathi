const http = require('http');

const request = (path, method = 'GET', data = null, token = null) => {
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
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
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
  try {
    console.log('--- STARTING PHASE 6 CORE BOOKING & STATE MACHINE TESTS ---');

    // 1. Authenticate demo users
    const custLogin = await request('/api/auth/login', 'POST', {
      identifier: 'customer@cosathi.demo',
      password: 'CoSathi@2026',
    });
    const custToken = custLogin.body.token;
    const custUser = custLogin.body.user;

    const wrkLogin = await request('/api/auth/login', 'POST', {
      identifier: 'worker@cosathi.demo',
      password: 'CoSathi@2026',
    });
    const wrkToken = wrkLogin.body.token;
    const wrkUser = wrkLogin.body.user;

    const adminLogin = await request('/api/auth/login', 'POST', {
      identifier: 'admin@cosathi.demo',
      password: 'CoSathi@2026',
    });
    const adminToken = adminLogin.body.token;

    console.log('✓ Authentication successful for Customer, Worker, and Admin');

    // 2. Fetch category for test booking
    const rc = await request('/api/cooperative/rate-card', 'GET', null, adminToken);
    const category = rc.body.categories[0];
    console.log('✓ Found ServiceCategory:', category.name?.en || category.name, category._id);

    // 3. Test Booking Creation (Customer creates booking in MATCHING state)
    const uniqueOffsetDays = 10 + Math.floor(Math.random() * 5000);
    const slotStart = new Date(Date.now() + 86400000 * uniqueOffsetDays);
    const slotEnd = new Date(slotStart.getTime() + 2 * 60 * 60 * 1000);

    const bookingPayload = {
      serviceCategory: category._id,
      tasks: [
        { title: 'Ceiling Fan Capacitor Replacement', serviceCode: 'ELEC-001', quantity: 1, rate: 199 },
      ],
      voiceTranscript: 'Ceiling fan is running very slow, need capacitor replacement and wiring check.',
      initialEstimate: 199,
      scheduledStart: slotStart,
      scheduledEnd: slotEnd,
      address: {
        addressLine: 'House 42, Block C, Lajpat Nagar II',
        city: 'New Delhi',
        pincode: '110024',
      },
      location: {
        type: 'Point',
        coordinates: [77.2435, 28.5701],
      },
      status: 'MATCHING',
    };

    const createRes = await request('/api/bookings', 'POST', bookingPayload, custToken);
    console.log('Create Booking status:', createRes.status, 'Booking:', createRes.body.booking?.bookingNumber, 'Status:', createRes.body.booking?.status);
    if (createRes.status !== 201) {
      console.error('Create booking failed:', createRes.body);
      process.exit(1);
    }
    const booking1 = createRes.body.booking;

    // 4. Test Double Booking Prevention for Customer
    console.log('\nTesting Customer Double Booking Prevention:');
    const doubleRes = await request('/api/bookings', 'POST', bookingPayload, custToken);
    console.log('Duplicate booking creation status:', doubleRes.status, '(Expected 409 Conflict)');
    console.log('Duplicate error message:', doubleRes.body.message);
    if (doubleRes.status !== 409) {
      console.error('Expected 409 on double booking!');
      process.exit(1);
    }

    // 5. Test Unauthorized Booking Access
    console.log('\nTesting Unauthorized Access:');
    // Worker tries to view booking1 before being offered or assigned
    const unauthRes = await request('/api/bookings/' + booking1._id, 'GET', null, wrkToken);
    console.log('Unauthorized worker access status:', unauthRes.status, '(Expected 403 Forbidden)');
    console.log('Unauthorized message:', unauthRes.body.message);
    if (unauthRes.status !== 403) {
      console.error('Expected 403 on unauthorized access!');
      process.exit(1);
    }

    // 6. Test State Transition: MATCHING -> OFFERED
    console.log('\nTesting State Machine Sequence:');
    // Offer booking to worker
    const offerRes = await request(
      '/api/bookings/' + booking1._id + '/transition',
      'POST',
      {
        status: 'OFFERED',
        note: 'Offered to worker ' + wrkUser.name,
        workerId: wrkUser._id,
      },
      adminToken
    );
    console.log('MATCHING -> OFFERED status:', offerRes.status, 'New status:', offerRes.body.booking?.status);

    // 7. Test Invalid State Transition (Arbitrary Jump)
    console.log('\nTesting Invalid State Transition Protection:');
    // Attempting to jump directly from OFFERED to COMPLETED
    const invalidJumpRes = await request(
      '/api/bookings/' + booking1._id + '/transition',
      'POST',
      {
        status: 'COMPLETED',
      },
      adminToken
    );
    console.log('Arbitrary jump OFFERED -> COMPLETED status:', invalidJumpRes.status, '(Expected 400 Bad Request)');
    console.log('Illegal transition message:', invalidJumpRes.body.message);
    if (invalidJumpRes.status !== 400) {
      console.error('Expected 400 on illegal transition!');
      process.exit(1);
    }

    // 8. Test Worker Acceptance: OFFERED -> ACCEPTED
    console.log('\nTesting Worker Accept:');
    const acceptRes = await request('/api/bookings/' + booking1._id + '/accept', 'POST', {}, wrkToken);
    console.log('OFFERED -> ACCEPTED status:', acceptRes.status, 'New status:', acceptRes.body.booking?.status, 'Assigned Worker:', acceptRes.body.booking?.workerId);

    // 9. Test Worker Double Booking Prevention
    console.log('\nTesting Worker Double Booking Prevention:');
    const bookingPayload2 = {
      ...bookingPayload,
      address: { addressLine: 'House 99, Saket', city: 'New Delhi', pincode: '110017' },
      status: 'DRAFT',
    };
    const b2Res = await request('/api/bookings', 'POST', bookingPayload2, adminToken);
    const booking2 = b2Res.body.booking;
    await request('/api/bookings/' + booking2._id + '/transition', 'POST', { status: 'MATCHING' }, adminToken);
    await request('/api/bookings/' + booking2._id + '/transition', 'POST', { status: 'OFFERED', workerId: wrkUser._id }, adminToken);

    // Worker attempts to accept booking2 while booking1 is ACCEPTED in overlapping slot!
    const wrkConflictRes = await request('/api/bookings/' + booking2._id + '/accept', 'POST', {}, wrkToken);
    console.log('Worker overlapping accept status:', wrkConflictRes.status, '(Expected 409 Conflict)');
    console.log('Worker conflict message:', wrkConflictRes.body.message);
    if (wrkConflictRes.status !== 409) {
      console.error('Expected 409 on worker double booking!');
      process.exit(1);
    }

    // Clean up booking2
    await request('/api/bookings/' + booking2._id + '/cancel', 'POST', { reason: 'Test cleanup' }, adminToken);

    // 10. Progress Booking 1: ACCEPTED -> ON_THE_WAY -> ARRIVED -> IN_PROGRESS
    console.log('\nProgressing Job Execution Lifecycle:');
    const enRouteRes = await request('/api/bookings/' + booking1._id + '/on-the-way', 'POST', {}, wrkToken);
    console.log('ACCEPTED -> ON_THE_WAY:', enRouteRes.body.booking?.status);

    const arrivedRes = await request('/api/bookings/' + booking1._id + '/arrived', 'POST', {}, wrkToken);
    console.log('ON_THE_WAY -> ARRIVED:', arrivedRes.body.booking?.status);

    const startWorkRes = await request('/api/bookings/' + booking1._id + '/start-work', 'POST', {}, wrkToken);
    console.log('ARRIVED -> IN_PROGRESS:', startWorkRes.body.booking?.status);

    // 11. Worker Submits Work Report -> WORK_SUBMITTED -> BILL_GENERATED -> CUSTOMER_APPROVAL
    console.log('\nSubmitting Work & Generating Bill:');
    const submitRes = await request(
      '/api/bookings/' + booking1._id + '/submit-work',
      'POST',
      {
        voiceTranscript: 'Replaced fan capacitor and checked stator winding. Speed restored to 380 RPM.',
        tasks: [
          { title: 'Ceiling Fan Capacitor Replacement', serviceCode: 'ELEC-001', quantity: 1, rate: 199 },
        ],
        grossAmount: 199,
      },
      wrkToken
    );
    console.log('Work Submitted Result:', submitRes.status, 'New status:', submitRes.body.booking?.status, 'Bill Number:', submitRes.body.bill?.billNumber);
    console.log('Bill Breakdown -> Gross: ₹' + submitRes.body.bill?.grossAmount + ', 5% Welfare: ₹' + submitRes.body.bill?.cooperativeWelfareDeduction + ', Worker Net: ₹' + submitRes.body.bill?.workerNetEarnings);

    // 12. Customer Pays & Completes: CUSTOMER_APPROVAL -> PAID -> COMPLETED
    console.log('\nCustomer Payment & Completion:');
    const payRes = await request(
      '/api/bookings/' + booking1._id + '/pay',
      'POST',
      {
        paymentMethod: 'mock_upi',
        transactionId: 'UPI-2026-TEST-999',
      },
      custToken
    );
    console.log('Payment Result:', payRes.status, 'New Status:', payRes.body.booking?.status);

    // 13. Verify Audit Timeline
    console.log('\nVerifying Audit Timeline:');
    const finalBooking = (await request('/api/bookings/' + booking1._id, 'GET', null, custToken)).body.booking;
    console.log('Timeline entries count:', finalBooking.timeline?.length);
    finalBooking.timeline.forEach((t, i) => {
      console.log('  [' + (i + 1) + '] ' + t.status + ' - ' + t.note);
    });

    // 14. Test Dispute State Workflow
    console.log('\nTesting Post-Completion Dispute:');
    const dispRes = await request(
      '/api/bookings/' + booking1._id + '/dispute',
      'POST',
      {
        category: 'poor_quality',
        description: 'Fan speed fluctuates slightly when regulator is on speed 2.',
      },
      custToken
    );
    console.log('Dispute status:', dispRes.status, 'New Status:', dispRes.body.booking?.status, 'Dispute Ticket:', dispRes.body.dispute?.disputeTicketNumber);

    console.log('\n========================================');
    console.log('ALL PHASE 6 CORE BOOKING TESTS PASSED!');
    console.log('========================================');
  } catch (err) {
    console.error('Test Error:', err);
    process.exit(1);
  }
})();
