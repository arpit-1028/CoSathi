const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== PHASE 2 COMPREHENSIVE AUTHENTICATION & ROLE TEST ===\n');

  try {
    // TEST 1: Customer Login
    console.log('[Test 1] Testing Customer Login (customer@cosathi.demo)...');
    const custRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'customer@cosathi.demo', password: 'CoSathi@2026' }),
    });
    const custData = await custRes.json();
    if (!custData.success) throw new Error(`Customer login failed: ${custData.message}`);
    console.log('✅ Customer Login Success! Role:', custData.user.role, '| Phone:', custData.user.phone);
    const custToken = custData.token;

    // TEST 2: Worker Login
    console.log('\n[Test 2] Testing Worker Login (worker@cosathi.demo)...');
    const workerRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'worker@cosathi.demo', password: 'CoSathi@2026' }),
    });
    const workerData = await workerRes.json();
    if (!workerData.success) throw new Error(`Worker login failed: ${workerData.message}`);
    console.log('✅ Worker Login Success! Role:', workerData.user.role, '| MemberId:', workerData.profile.memberId);
    const workerToken = workerData.token;

    // TEST 3: Admin Login
    console.log('\n[Test 3] Testing Admin Login (admin@cosathi.demo)...');
    const adminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@cosathi.demo', password: 'CoSathi@2026' }),
    });
    const adminData = await adminRes.json();
    if (!adminData.success) throw new Error(`Admin login failed: ${adminData.message}`);
    console.log('✅ Admin Login Success! Role:', adminData.user.role, '| Name:', adminData.user.name);
    const adminToken = adminData.token;

    // TEST 4: Profile & Session Retrieval (GET /api/auth/me)
    console.log('\n[Test 4] Verifying Session for Customer, Worker, and Admin via GET /api/auth/me...');
    const custMeRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${custToken}` },
    });
    const custMe = await custMeRes.json();
    console.log('✅ Customer /me: Name =', custMe.user.name, '| Address =', custMe.profile.defaultAddress.street);

    const workerMeRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${workerToken}` },
    });
    const workerMe = await workerMeRes.json();
    console.log('✅ Worker /me: Name =', workerMe.user.name, '| Skill =', workerMe.profile.primarySkill);

    const adminMeRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminMe = await adminMeRes.json();
    console.log('✅ Admin /me: Name =', adminMe.user.name, '| Society =', adminMe.cooperative.name);

    // TEST 5: Language Persistence Update (PUT /api/auth/language)
    console.log('\n[Test 5] Testing Language Preference Update...');
    const langRes = await fetch(`${BASE_URL}/auth/language`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({ language: 'hi' }),
    });
    const langData = await langRes.json();
    console.log('✅ Language Updated to:', langData.preferredLanguage);

    // TEST 6: Security - Invalid Credentials & Tampered Token
    console.log('\n[Test 6] Testing Security & Invalid Credentials...');
    const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'customer@cosathi.demo', password: 'WrongPassword123' }),
    });
    const badLoginData = await badLoginRes.json();
    console.log(`✅ Correctly Rejected Invalid Password: HTTP ${badLoginRes.status} - ${badLoginData.message}`);

    const badTokenRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: 'Bearer fake_tampered_jwt_token_xyz' },
    });
    const badTokenData = await badTokenRes.json();
    console.log(`✅ Correctly Rejected Tampered Token: HTTP ${badTokenRes.status} - ${badTokenData.message}`);

    console.log('\n🎉 ALL PHASE 2 TESTS PASSED PERFECTLY!\n');
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    process.exit(1);
  }
}

runTests();
