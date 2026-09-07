const http = require('http');
const { io } = require('socket.io-client');

const API_BASE = 'http://localhost:5000';
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

const createSocketClient = (token, roleName) => {
  return new Promise((resolve, reject) => {
    const socket = io(API_BASE, {
      auth: { token },
      transports: ['websocket'],
      reconnection: false,
    });

    const timeout = setTimeout(() => {
      reject(new Error(`Socket connection timed out for ${roleName}`));
    }, 5000);

    socket.on('connect', () => {
      clearTimeout(timeout);
      console.log(`  [Socket] ${roleName} connected successfully (id: ${socket.id})`);
      resolve(socket);
    });

    socket.on('connect_error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
};

(async () => {
  console.log('=====================================================================');
  console.log('⭐ PHASE 8: SOCKET.IO REAL-TIME BOOKING DISPATCH & LIFECYCLE TEST ⭐');
  console.log('=====================================================================');

  try {
    // 1. Authenticate Customer
    console.log('\n--- 1. Authenticating Users ---');
    const custLogin = await request('/api/auth/login', 'POST', {
      identifier: 'customer@cosathi.demo',
      password: 'CoSathi@2026',
    });
    assert(custLogin.status === 200, 'Customer authenticated successfully');
    const custToken = custLogin.body.token;
    const custUser = custLogin.body.user;

    // 2. Authenticate Worker 1 (Ramesh)
    const wrk1Login = await request('/api/auth/login', 'POST', {
      identifier: 'worker@cosathi.demo',
      password: 'CoSathi@2026',
    });
    assert(wrk1Login.status === 200, 'Worker 1 (Ramesh) authenticated successfully');
    const wrk1Token = wrk1Login.body.token;
    const wrk1User = wrk1Login.body.user;

    // 3. Register or Login Worker 2 (Sunita)
    let wrk2Token = null;
    let wrk2User = null;
    const wrk2Login = await request('/api/auth/login', 'POST', {
      identifier: 'worker2@cosathi.demo',
      password: 'CoSathi@2026',
    });

    if (wrk2Login.status === 200) {
      wrk2Token = wrk2Login.body.token;
      wrk2User = wrk2Login.body.user;
    } else {
      const regRes = await request('/api/auth/register', 'POST', {
        name: 'Sunita Sharma',
        email: 'worker2@cosathi.demo',
        phone: '+91 98111 22233',
        password: 'CoSathi@2026',
        role: 'worker',
        primarySkill: 'electrical',
        yearsOfExperience: 6,
      });
      assert(regRes.status === 201, 'Worker 2 (Sunita) registered successfully');
      wrk2Token = regRes.body.token;
      wrk2User = regRes.body.user;
    }
    assert(Boolean(wrk2Token), 'Worker 2 ready for dispatch fallback testing');

    // 4. Connect Socket Clients
    console.log('\n--- 2. Connecting Real-Time Sockets with Dedicated Rooms ---');
    const custSocket = await createSocketClient(custToken, 'Customer (Ananya)');
    const wrk1Socket = await createSocketClient(wrk1Token, 'Worker 1 (Ramesh)');
    const wrk2Socket = await createSocketClient(wrk2Token, 'Worker 2 (Sunita)');

    // Ensure server room joins and worker registration are processed
    await new Promise((r) => setTimeout(r, 600));

    // -------------------------------------------------------------------------
    // TEST SCENARIO A: Booking Creation -> Real-time Worker Offer -> Acceptance
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Scenario A: Real-Time Dispatch & Worker Acceptance ---');

    // Promise that resolves when ANY of the online candidate workers receives the offer
    let offerReceivedPromise = new Promise((resolve) => {
      const onOffer1 = (offer) => {
        wrk1Socket.off('booking:offer', onOffer1);
        wrk2Socket.off('booking:offer', onOffer2);
        resolve({ worker: wrk1User, token: wrk1Token, socket: wrk1Socket, offer });
      };
      const onOffer2 = (offer) => {
        wrk1Socket.off('booking:offer', onOffer1);
        wrk2Socket.off('booking:offer', onOffer2);
        resolve({ worker: wrk2User, token: wrk2Token, socket: wrk2Socket, offer });
      };
      wrk1Socket.on('booking:offer', onOffer1);
      wrk2Socket.on('booking:offer', onOffer2);
    });

    let customerAcceptedPromise = new Promise((resolve) => {
      const handler = (acceptedPayload) => {
        custSocket.off('booking:accepted', handler);
        resolve(acceptedPayload);
      };
      custSocket.on('booking:accepted', handler);
    });

    const randomDayOffset = 100 + Math.floor(Math.random() * 50000);
    const booking1Start = new Date(Date.now() + 86400000 * randomDayOffset);

    // Customer creates booking
    console.log('  Customer creating electrical booking...');
    const createRes = await request(
      '/api/bookings',
      'POST',
      {
        serviceCategory: 'electrical',
        tasks: [
          {
            title: 'Ceiling Fan Diagnostic & Capacitor Service',
            serviceCode: 'ELEC-FAN-01',
            quantity: 1,
            estimatedPrice: 299,
          },
        ],
        voiceTranscript: 'Fan in living room making humming noise and moving slowly.',
        initialEstimate: 299,
        scheduledStart: booking1Start,
        address: {
          addressLine: 'B-42, Lajpat Nagar II',
          city: 'Delhi',
          pincode: '110024',
        },
        location: {
          type: 'Point',
          coordinates: [77.2433, 28.57],
        },
      },
      custToken
    );

    console.log('  Create booking response:', createRes.status, createRes.body);
    assert(createRes.status === 201, `Booking created: ${createRes.body.booking?.bookingNumber}`);
    const booking1 = createRes.body.booking;

    // Wait for the fair matching engine to dispatch real-time offer to top candidate
    console.log('  Waiting for fair engine real-time booking:offer on worker socket...');
    const winner = await offerReceivedPromise;
    assert(Boolean(winner.offer), `Top fair match candidate (${winner.worker.name}) received real-time booking:offer`);
    assert(
      winner.offer.bookingNumber === booking1.bookingNumber,
      `Offer booking number matches created booking (${winner.offer.bookingNumber})`
    );
    assert(
      winner.offer.timeoutSeconds === 60,
      `Offer includes server-side 60s countdown (timeoutSeconds: ${winner.offer.timeoutSeconds})`
    );
    assert(
      Boolean(winner.offer.floorPayout),
      `Offer includes guaranteed floor payout: ₹${winner.offer.floorPayout}`
    );

    // Matched worker accepts the offer
    console.log(`  Worker (${winner.worker.name}) accepting offer via /accept API...`);
    const acceptRes = await request(
      `/api/worker/bookings/${booking1._id}/accept`,
      'POST',
      {},
      winner.token
    );
    assert(acceptRes.status === 200, `Worker (${winner.worker.name}) accept request succeeded`);

    // Customer receives booking:accepted via socket without browser refresh
    console.log('  Waiting for real-time booking:accepted on Customer socket...');
    const custAcceptedPayload = await customerAcceptedPromise;
    assert(Boolean(custAcceptedPayload), 'Customer received real-time booking:accepted event without refresh');
    assert(
      custAcceptedPayload.worker?.name === winner.worker.name,
      `Assigned worker verified as ${custAcceptedPayload.worker?.name}`
    );
    assert(
      Boolean(custAcceptedPayload.worker?.trade),
      `Worker trade delivered: ${custAcceptedPayload.worker?.trade}`
    );

    // -------------------------------------------------------------------------
    // TEST SCENARIO B: Real-Time Lifecycle Updates (En-route -> Arrived -> Completed)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing Real-Time Status Broadcasts Across Lifecycle ---');

    // Worker: On the way
    let enRoutePromise = new Promise((resolve) => {
      custSocket.once('booking:worker_arriving', resolve);
    });
    await request(`/api/worker/bookings/${booking1._id}/on-the-way`, 'POST', {}, winner.token);
    const enRouteEvent = await enRoutePromise;
    assert(Boolean(enRouteEvent), 'Customer received booking:worker_arriving event (On the way)');

    // Worker: Arrived
    let arrivedPromise = new Promise((resolve) => {
      custSocket.once('booking:worker_arriving', resolve);
    });
    await request(`/api/worker/bookings/${booking1._id}/arrived`, 'POST', {}, winner.token);
    const arrivedEvent = await arrivedPromise;
    assert(Boolean(arrivedEvent), 'Customer received booking:worker_arriving event (Arrived)');

    // Worker: Start Work
    let startPromise = new Promise((resolve) => {
      custSocket.once('booking:started', resolve);
    });
    await request(`/api/worker/bookings/${booking1._id}/start-work`, 'POST', {}, winner.token);
    const startEvent = await startPromise;
    assert(Boolean(startEvent), 'Customer received booking:started event');

    // Worker: Submit Work Report
    let reportPromise = new Promise((resolve) => {
      const handler = (evt) => {
        if (evt.status === 'CUSTOMER_APPROVAL') {
          custSocket.off('booking:status_updated', handler);
          resolve(evt);
        }
      };
      custSocket.on('booking:status_updated', handler);
    });
    await request(
      `/api/worker/bookings/${booking1._id}/submit-work`,
      'POST',
      {
        voiceTranscript: 'Replaced ceiling fan capacitor and oiled ball bearings.',
        tasks: [
          {
            title: 'Capacitor Replacement',
            serviceCode: 'ELEC-CAP-01',
            quantity: 1,
            rate: 299,
          },
        ],
        grossAmount: 299,
      },
      winner.token
    );
    const reportEvent = await reportPromise;
    assert(
      Boolean(reportEvent) && reportEvent.status === 'CUSTOMER_APPROVAL',
      'Customer received bill for approval in status CUSTOMER_APPROVAL'
    );

    // Customer: Approve & Pay
    let completePromise = new Promise((resolve) => {
      custSocket.once('booking:completed', resolve);
    });
    await request(
      `/api/customer/bookings/${booking1._id}/pay`,
      'POST',
      { paymentMethod: 'upi_mock', transactionId: `TXN-${Date.now()}` },
      custToken
    );
    const completeEvent = await completePromise;
    assert(Boolean(completeEvent), 'Customer and Worker received booking:completed event');

    // -------------------------------------------------------------------------
    // TEST SCENARIO C: Worker Decline & Automatic Fallback to Next Candidate
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Scenario C: Worker Decline & Auto-Fallback to Next Candidate ---');

    let firstOfferPromise = new Promise((resolve) => {
      const onOffer1 = (offer) => {
        wrk1Socket.off('booking:offer', onOffer1);
        wrk2Socket.off('booking:offer', onOffer2);
        resolve({ firstWorker: wrk1User, firstToken: wrk1Token, otherSocket: wrk2Socket, otherWorker: wrk2User, otherToken: wrk2Token, offer });
      };
      const onOffer2 = (offer) => {
        wrk1Socket.off('booking:offer', onOffer1);
        wrk2Socket.off('booking:offer', onOffer2);
        resolve({ firstWorker: wrk2User, firstToken: wrk2Token, otherSocket: wrk1Socket, otherWorker: wrk1User, otherToken: wrk1Token, offer });
      };
      wrk1Socket.on('booking:offer', onOffer1);
      wrk2Socket.on('booking:offer', onOffer2);
    });

    // Create Booking 2
    const booking2Res = await request(
      '/api/bookings',
      'POST',
      {
        serviceCategory: 'electrical',
        tasks: [
          {
            title: 'Main Switchboard MCB Tripping Diagnostic',
            serviceCode: 'ELEC-MCB-01',
            quantity: 1,
            estimatedPrice: 349,
          },
        ],
        voiceTranscript: 'MCB trips every time the geyser is turned on.',
        initialEstimate: 349,
        scheduledStart: new Date(Date.now() + 86400000 * (randomDayOffset + 50)),
        address: {
          addressLine: 'A-12, Defence Colony',
          city: 'Delhi',
          pincode: '110024',
        },
        location: {
          type: 'Point',
          coordinates: [77.23, 28.57],
        },
      },
      custToken
    );
    assert(booking2Res.status === 201, `Booking 2 created: ${booking2Res.body.booking?.bookingNumber}`);
    const booking2 = booking2Res.body.booking;

    console.log('  Waiting for first candidate to receive Booking 2 offer...');
    const firstCandidate = await firstOfferPromise;
    assert(firstCandidate.offer.bookingNumber === booking2.bookingNumber, `First candidate (${firstCandidate.firstWorker.name}) received offer for Booking 2`);

    // Prepare promise for the other candidate to receive the fallback offer
    let fallbackOfferPromise = new Promise((resolve) => {
      firstCandidate.otherSocket.once('booking:offer', (offer) => {
        resolve(offer);
      });
    });

    // First worker declines the offer
    console.log(`  First candidate (${firstCandidate.firstWorker.name}) declining offer...`);
    const declineRes = await request(
      `/api/worker/bookings/${booking2._id}/decline`,
      'POST',
      { reason: 'Engaged in cooperative training session' },
      firstCandidate.firstToken
    );
    assert(declineRes.status === 200, `First candidate (${firstCandidate.firstWorker.name}) successfully declined offer`);

    // Backend automatically re-runs matching, excludes first candidate, and dispatches to second candidate!
    console.log(`  Waiting for automatic re-dispatch to second candidate (${firstCandidate.otherWorker.name})...`);
    const fallbackOffer = await fallbackOfferPromise;
    assert(Boolean(fallbackOffer), `Second candidate (${firstCandidate.otherWorker.name}) received automatically re-dispatched offer`);
    assert(
      fallbackOffer.bookingNumber === booking2.bookingNumber,
      `Fallback offer matches Booking 2 (${fallbackOffer.bookingNumber})`
    );

    // Second candidate accepts
    let custAssigned2Promise = new Promise((resolve) => {
      custSocket.once('booking:accepted', resolve);
    });
    await request(`/api/worker/bookings/${booking2._id}/accept`, 'POST', {}, firstCandidate.otherToken);
    const assigned2 = await custAssigned2Promise;
    assert(
      assigned2.worker?.name === firstCandidate.otherWorker.name,
      `Customer notified in real time that second candidate (${assigned2.worker?.name}) accepted the job`
    );

    // Clean up sockets
    custSocket.disconnect();
    wrk1Socket.disconnect();
    wrk2Socket.disconnect();

    console.log('\n=====================================================================');
    console.log(`⭐ PHASE 8 TESTS COMPLETE: ${passedTests}/${totalTests} PASSED ⭐`);
    console.log('=====================================================================');

    process.exit(passedTests === totalTests ? 0 : 1);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
})();
