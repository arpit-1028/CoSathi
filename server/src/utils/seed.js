const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const { connectDB, disconnectDB } = require('../config/db');
const {
  User,
  CustomerProfile,
  WorkerProfile,
  Cooperative,
  ServiceCategory,
  RateCardItem,
  RateCardVersion,
  Booking,
  BookingAssignment,
  BookingStatusHistory,
  WorkerAvailability,
  WorkerLocation,
  WorkerPerformance,
  Review,
  Bill,
  Payment,
  Dispute,
  WelfareRecord,
  Transaction,
  DemandForecast,
  Notification,
  AuditLog,
} = require('../models');

const runSeed = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      CustomerProfile.deleteMany({}),
      WorkerProfile.deleteMany({}),
      Cooperative.deleteMany({}),
      ServiceCategory.deleteMany({}),
      RateCardItem.deleteMany({}),
      RateCardVersion.deleteMany({}),
      Booking.deleteMany({}),
      BookingAssignment.deleteMany({}),
      BookingStatusHistory.deleteMany({}),
      WorkerAvailability.deleteMany({}),
      WorkerLocation.deleteMany({}),
      WorkerPerformance.deleteMany({}),
      Review.deleteMany({}),
      Bill.deleteMany({}),
      Payment.deleteMany({}),
      Dispute.deleteMany({}),
      WelfareRecord.deleteMany({}),
      Transaction.deleteMany({}),
      DemandForecast.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);
    console.log('[Seed] Database cleaned.');

    const defaultPasswordHash = await bcrypt.hash('CoSathi@2026', 10);

    // 1. Seed Cooperative
    console.log('[Seed] Creating Cooperative...');
    const cooperative = await Cooperative.create({
      name: 'Delhi Shramik Kalyan Sahakari Samiti Ltd.',
      registrationNumber: 'DL-COOP-2026-9874',
      registeredOffice: {
        address: 'Cooperative Bhavan, Barakhamba Road',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
      },
      serviceZones: [
        { zoneName: 'South Delhi', pincodes: ['110017', '110019', '110024', '110048'] },
        { zoneName: 'Central Delhi', pincodes: ['110001', '110002', '110005', '110055'] },
        { zoneName: 'West Delhi', pincodes: ['110015', '110026', '110027', '110058'] },
        { zoneName: 'Dwarka Sub-City', pincodes: ['110075', '110077', '110078'] },
      ],
      contactPhone: '011-23345678',
      contactEmail: 'admin@delhicooperative.org',
      welfareFundBalance: 175000,
      cooperativeSharePercent: 5,
    });

    // 2. Cooperative Admin User
    const adminUser = await User.create({
      name: 'Sunil Sharma',
      phone: '9811001100',
      email: 'admin@cosathi.demo',
      password: defaultPasswordHash,
      role: 'cooperative_admin',
      preferredLanguage: 'en',
      status: 'active',
    });
    cooperative.admins.push(adminUser._id);
    await cooperative.save();

    // 3. Service Categories
    console.log('[Seed] Creating Service Categories...');
    const categoriesData = [
      {
        name: { en: 'Electrical Works', hi: 'विद्युत कार्य' },
        slug: 'electrical',
        icon: 'Zap',
        description: { en: 'Fan repair, switches, wiring, MCB troubleshooting', hi: 'पंखा मरम्मत, स्विच, वायरिंग, एमसीबी जांच' },
        baseInspectionFee: 149,
        displayOrder: 1,
      },
      {
        name: { en: 'Plumbing Services', hi: 'नलसाजी (प्लंबर) सेवाएं' },
        slug: 'plumbing',
        icon: 'Droplets',
        description: { en: 'Leak fixes, taps, sanitary fittings, tank valves', hi: 'लीकेज मरम्मत, नल, सैनिटरी फिटिंग, टंकी वाल्व' },
        baseInspectionFee: 149,
        displayOrder: 2,
      },
      {
        name: { en: 'Appliance Repair', hi: 'उपकरण मरम्मत' },
        slug: 'appliance-repair',
        icon: 'Tv',
        description: { en: 'AC service, refrigerator, washing machine repair', hi: 'एसी सर्विस, फ्रिज, वॉशिंग मशीन मरम्मत' },
        baseInspectionFee: 199,
        displayOrder: 3,
      },
      {
        name: { en: 'Carpentry & Woodwork', hi: 'बढ़ईगीरी (कारपेंटर)' },
        slug: 'carpentry',
        icon: 'Hammer',
        description: { en: 'Door locks, hinges, drawer repair, furniture assembling', hi: 'दरवाजे के ताले, कब्जे, दराज और फर्नीचर कार्य' },
        baseInspectionFee: 149,
        displayOrder: 4,
      },
      {
        name: { en: 'Home Sanitization & Cleaning', hi: 'घर की सफाई एवं स्वच्छता' },
        slug: 'cleaning',
        icon: 'Sparkles',
        description: { en: 'Kitchen deep clean, bathroom descaling, sofa shampooing', hi: 'रसोई गहरी सफाई, बाथरूम सफाई, सोफा सफाई' },
        baseInspectionFee: 199,
        displayOrder: 5,
      },
    ];

    const categories = await ServiceCategory.insertMany(categoriesData);
    const catMap = {};
    categories.forEach((c) => { catMap[c.slug] = c._id; });

    // 4. Rate Card Items
    console.log('[Seed] Creating Rate Card Items...');
    const rateCardData = [
      {
        category: catMap['electrical'],
        serviceCode: 'ELEC_FAN_REPAIR',
        title: { en: 'Ceiling Fan Repair / Capacitor Replace', hi: 'सीलिंग फैन मरम्मत / कैपेसिटर बदलाव' },
        billingType: 'per_unit',
        standardRate: 199,
        estimatedDurationMinutes: 45,
        cooperativeMinRate: 180,
        cooperativeMaxRate: 250,
      },
      {
        category: catMap['electrical'],
        serviceCode: 'ELEC_SWITCH_REP',
        title: { en: 'Switch / Socket Replacement', hi: 'स्विच / सॉकेट बदलना' },
        billingType: 'per_point',
        standardRate: 99,
        estimatedDurationMinutes: 30,
        cooperativeMinRate: 80,
        cooperativeMaxRate: 120,
      },
      {
        category: catMap['electrical'],
        serviceCode: 'ELEC_MCB_FAULT',
        title: { en: 'MCB Tripping / Short Circuit Diagnosis', hi: 'एमसीबी ट्रिपिंग / शॉर्ट सर्किट जांच' },
        billingType: 'fixed',
        standardRate: 299,
        estimatedDurationMinutes: 60,
        cooperativeMinRate: 250,
        cooperativeMaxRate: 350,
      },
      {
        category: catMap['plumbing'],
        serviceCode: 'PLUMB_TAP_LEAK',
        title: { en: 'Water Tap Leakage Fix / Spindle Change', hi: 'पानी के नल का रिसाव ठीक करना / स्पिंडल बदलना' },
        billingType: 'per_unit',
        standardRate: 149,
        estimatedDurationMinutes: 30,
        cooperativeMinRate: 120,
        cooperativeMaxRate: 180,
      },
      {
        category: catMap['plumbing'],
        code: 'TAP_REPLACEMENT',
        serviceCode: 'TAP_REPLACEMENT',
        name: 'Tap Replacement & Installation',
        nameHindi: 'नल बदलना एवं लगाना',
        title: { en: 'Tap Replacement & Installation', hi: 'नल बदलना एवं लगाना' },
        unit: 'per_unit',
        billingType: 'per_unit',
        basePrice: 300,
        standardRate: 300,
        minPrice: 250,
        cooperativeMinRate: 250,
        maxPrice: 350,
        cooperativeMaxRate: 350,
        durationMinutes: 30,
        estimatedDurationMinutes: 30,
        active: true,
      },
      {
        category: catMap['plumbing'],
        code: 'DRAIN_BLOCKAGE',
        serviceCode: 'DRAIN_BLOCKAGE',
        name: 'Drain Blockage & Sewage Clearance',
        nameHindi: 'ड्रेन ब्लॉकेज एवं सीवेज सफाई',
        title: { en: 'Drain Blockage & Sewage Clearance', hi: 'ड्रेन ब्लॉकेज एवं सीवेज सफाई' },
        unit: 'fixed',
        billingType: 'fixed',
        basePrice: 250,
        standardRate: 250,
        minPrice: 200,
        cooperativeMinRate: 200,
        maxPrice: 300,
        cooperativeMaxRate: 300,
        durationMinutes: 60,
        estimatedDurationMinutes: 60,
        active: true,
      },
      {
        category: catMap['plumbing'],
        code: 'PIPE_CLEANING',
        serviceCode: 'PIPE_CLEANING',
        name: 'Pipe Cleaning & Scale Flush',
        nameHindi: 'पाइप की सफाई एवं स्केल फ्लश',
        title: { en: 'Pipe Cleaning & Scale Flush', hi: 'पाइप की सफाई एवं स्केल फ्लश' },
        unit: 'per_unit',
        billingType: 'per_unit',
        basePrice: 100,
        standardRate: 100,
        minPrice: 80,
        cooperativeMinRate: 80,
        maxPrice: 150,
        cooperativeMaxRate: 150,
        durationMinutes: 30,
        estimatedDurationMinutes: 30,
        active: true,
      },
      {
        category: catMap['appliance-repair'],
        serviceCode: 'AC_SERVICE_GEN',
        title: { en: 'Split AC Foam & Jet Pump Servicing', hi: 'स्प्लिट एसी फोम और जेट पंप सर्विसिंग' },
        billingType: 'per_unit',
        standardRate: 599,
        estimatedDurationMinutes: 75,
        cooperativeMinRate: 550,
        cooperativeMaxRate: 700,
      },
      {
        category: catMap['carpentry'],
        serviceCode: 'CARP_DOOR_LOCK',
        title: { en: 'Main Door Lock / Handle Installation', hi: 'मुख्य दरवाजे का ताला / हैंडल लगाना' },
        billingType: 'per_unit',
        standardRate: 249,
        estimatedDurationMinutes: 50,
        cooperativeMinRate: 200,
        cooperativeMaxRate: 300,
      },
      {
        category: catMap['cleaning'],
        serviceCode: 'CLEAN_KITCHEN_DEEP',
        title: { en: 'Complete Kitchen Degreasing & Deep Clean', hi: 'रसोई की संपूर्ण डीप क्लीनिंग व चिकनाई हटाना' },
        billingType: 'fixed',
        standardRate: 799,
        estimatedDurationMinutes: 120,
        cooperativeMinRate: 750,
        cooperativeMaxRate: 950,
      },
    ];
    await RateCardItem.insertMany(rateCardData);

    // Rate Card Version
    await RateCardVersion.create({
      cooperative: cooperative._id,
      versionNumber: 'v2026.1',
      effectiveFrom: new Date('2026-01-01'),
      approvedBy: adminUser._id,
      notes: 'SIH 2026 Cooperative Base Rate Card Schedule',
      isCurrent: true,
    });

    // 5. Seed Customers
    console.log('[Seed] Creating Customers...');
    const customersData = [
      {
        name: 'Ananya Deshmukh',
        phone: '9871000001',
        email: 'customer@cosathi.demo',
        role: 'customer',
        coords: [77.2435, 28.5677], // Lajpat Nagar
        address: 'B-42, Lajpat Nagar II, New Delhi',
        pincode: '110024',
      },
      {
        name: 'Vikram Malhotra',
        phone: '9871000002',
        email: 'vikram@example.com',
        role: 'customer',
        coords: [77.2144, 28.5244], // Saket
        address: 'Flat 302, Palm Greens, Saket, New Delhi',
        pincode: '110017',
      },
      {
        name: 'Meera Sen',
        phone: '9871000003',
        email: 'meera@example.com',
        role: 'customer',
        coords: [77.0460, 28.5921], // Dwarka
        address: 'Pocket 4, Sector 11, Dwarka, New Delhi',
        pincode: '110075',
      },
      {
        name: 'Rohit Kulkarni',
        phone: '9871000004',
        email: 'rohit@example.com',
        role: 'customer',
        coords: [77.2167, 28.6333], // Connaught Place
        address: 'Block E, Connaught Place, New Delhi',
        pincode: '110001',
      },
    ];

    const seededCustomers = [];
    for (const c of customersData) {
      const u = await User.create({
        name: c.name,
        phone: c.phone,
        email: c.email,
        password: defaultPasswordHash,
        role: 'customer',
        preferredLanguage: 'en',
      });

      await CustomerProfile.create({
        user: u._id,
        defaultAddress: {
          tag: 'Home',
          street: c.address,
          city: 'New Delhi',
          state: 'Delhi',
          pincode: c.pincode,
          location: {
            type: 'Point',
            coordinates: c.coords,
          },
        },
        totalBookings: 2,
      });

      seededCustomers.push(u);
    }

    // 6. Seed Workers (Tailored for Fairness Algorithm Testing)
    console.log('[Seed] Creating Workers tailored for Fair Matching tests...');
    const workersData = [
      // WORKER A: Star worker with heavy load (test fairness deprioritization)
      {
        name: 'Ramesh Kumar (Worker A)',
        phone: '9810010001',
        email: 'worker@cosathi.demo',
        skill: 'electrical',
        rating: 4.9,
        ratingsCount: 180,
        lifetimeJobs: 200,
        recentBookings: 12, // High recent load!
        fairnessScore: 0.42, // Lower fairness priority because already well-served
        coords: [77.2410, 28.5650], // Near Lajpat Nagar
        experience: 8,
      },
      // WORKER B: Skilled worker with low recent load (test fairness elevation)
      {
        name: 'Manoj Tiwari (Worker B)',
        phone: '9810010002',
        skill: 'electrical',
        rating: 4.6,
        ratingsCount: 75,
        lifetimeJobs: 90,
        recentBookings: 3, // Low recent load -> Should be favored by fairness!
        fairnessScore: 0.94, // High fairness boost
        coords: [77.2390, 28.5680], // Near Lajpat Nagar
        experience: 4,
      },
      // WORKER C: Balanced load
      {
        name: 'Suresh Yadav (Worker C)',
        phone: '9810010003',
        skill: 'electrical',
        rating: 4.8,
        ratingsCount: 130,
        lifetimeJobs: 150,
        recentBookings: 6,
        fairnessScore: 0.72,
        coords: [77.2440, 28.5700], // Near Lajpat Nagar
        experience: 6,
      },
      // Plumbers
      {
        name: 'Amit Sharma (Plumber)',
        phone: '9810010004',
        skill: 'plumbing',
        rating: 4.9,
        ratingsCount: 150,
        lifetimeJobs: 180,
        recentBookings: 14,
        fairnessScore: 0.38,
        coords: [77.2150, 28.5250], // Saket
        experience: 7,
      },
      {
        name: 'Imran Khan (Plumber Underloaded)',
        phone: '9810010005',
        skill: 'plumbing',
        rating: 4.5,
        ratingsCount: 45,
        lifetimeJobs: 60,
        recentBookings: 1, // Only 1 job recently!
        fairnessScore: 0.98,
        coords: [77.2130, 28.5230], // Saket
        experience: 3,
      },
      // Carpenters
      {
        name: 'Kavita Chauhan (Carpenter)',
        phone: '9810010006',
        skill: 'carpentry',
        rating: 4.7,
        ratingsCount: 65,
        lifetimeJobs: 85,
        recentBookings: 2,
        fairnessScore: 0.92,
        coords: [77.0480, 28.5910], // Dwarka
        experience: 5,
      },
      {
        name: 'Dinesh Vishwakarma (Carpenter)',
        phone: '9810010007',
        skill: 'carpentry',
        rating: 4.4,
        ratingsCount: 30,
        lifetimeJobs: 40,
        recentBookings: 0,
        fairnessScore: 1.0,
        coords: [77.0450, 28.5930], // Dwarka
        experience: 2,
      },
      // Appliance Technicians
      {
        name: 'Deepak Verma (Appliance Tech)',
        phone: '9810010008',
        skill: 'appliance-repair',
        rating: 4.8,
        ratingsCount: 110,
        lifetimeJobs: 130,
        recentBookings: 5,
        fairnessScore: 0.76,
        coords: [77.2170, 28.6340], // CP
        experience: 6,
      },
      {
        name: 'Rakesh Saini (Appliance Tech)',
        phone: '9810010009',
        skill: 'appliance-repair',
        rating: 4.6,
        ratingsCount: 60,
        lifetimeJobs: 75,
        recentBookings: 2,
        fairnessScore: 0.88,
        coords: [77.2180, 28.6320], // CP
        experience: 4,
      },
      // Cleaning Specialists
      {
        name: 'Sunita Devi (Cleaning Lead)',
        phone: '9810010010',
        skill: 'cleaning',
        rating: 4.9,
        ratingsCount: 190,
        lifetimeJobs: 210,
        recentBookings: 15,
        fairnessScore: 0.35,
        coords: [77.2400, 28.5630], // South Delhi
        experience: 9,
      },
      {
        name: 'Geeta Kumari (Cleaning Specialist)',
        phone: '9810010011',
        skill: 'cleaning',
        rating: 4.8,
        ratingsCount: 140,
        lifetimeJobs: 160,
        recentBookings: 8,
        fairnessScore: 0.65,
        coords: [77.2420, 28.5660], // South Delhi
        experience: 5,
      },
      {
        name: 'Pooja Rawat (Sanitation Specialist)',
        phone: '9810010012',
        skill: 'cleaning',
        rating: 4.7,
        ratingsCount: 80,
        lifetimeJobs: 110,
        recentBookings: 4,
        fairnessScore: 0.82,
        coords: [77.2450, 28.5680], // South Delhi
        experience: 3,
      },
    ];

    const seededWorkers = [];
    let memberCounter = 101;

    for (const w of workersData) {
      const u = await User.create({
        name: w.name,
        phone: w.phone,
        email: w.email || undefined,
        password: defaultPasswordHash,
        role: 'worker',
        preferredLanguage: 'hi',
        status: 'active',
      });

      await WorkerProfile.create({
        user: u._id,
        cooperative: cooperative._id,
        memberId: `COS-DL-2026-${memberCounter++}`,
        primarySkill: w.skill,
        skills: [{ category: w.skill, subSkills: ['Standard Inspection', 'Repairs'], experienceYears: w.experience }],
        experienceYears: w.experience,
        verificationStatus: 'approved',
        aadhaarVerification: {
          maskedNumber: `XXXX-XXXX-${Math.floor(1000 + Math.random() * 9000)}`,
          isSimulated: true,
          verifiedAt: new Date('2026-01-15'),
          notes: 'Cooperative in-person physical KYC simulated match.',
        },
        homeBaseLocation: {
          type: 'Point',
          coordinates: w.coords,
        },
        bankDetails: {
          accountHolder: w.name.split(' (')[0],
          accountNumberMasked: 'XXXXXX' + Math.floor(1000 + Math.random() * 9000),
          ifsc: 'SBIN0001234',
          upiId: `${w.phone}@upi`,
        },
      });

      await WorkerAvailability.create({
        worker: u._id,
        isOnDuty: true,
        currentStatus: 'idle',
      });

      await WorkerLocation.create({
        worker: u._id,
        location: {
          type: 'Point',
          coordinates: w.coords,
        },
        heading: 90,
        speed: 0,
        batteryLevel: 88,
      });

      await WorkerPerformance.create({
        worker: u._id,
        cooperative: cooperative._id,
        lifetimeJobsCompleted: w.lifetimeJobs,
        jobsCompletedLast7Days: w.recentBookings,
        jobsCompletedLast30Days: w.recentBookings * 3,
        averageRating: w.rating,
        totalRatingsCount: w.ratingsCount,
        acceptanceRatePercent: 96,
        cancellationRatePercent: 2,
        fairDistributionScore: w.fairnessScore,
        totalEarningsLifetime: w.lifetimeJobs * 350,
        lastAssignedAt: new Date(Date.now() - (15 - w.recentBookings) * 3600000 * 12),
      });

      seededWorkers.push(u);
    }

    // 7. Seed Sample Bookings & History
    console.log('[Seed] Creating Sample Bookings and History...');
    const sampleBooking = await Booking.create({
      bookingNumber: 'CS-2026-0905-001',
      customerId: seededCustomers[0]._id,
      customer: seededCustomers[0]._id,
      assignedWorker: seededWorkers[0]._id,
      workerId: seededWorkers[0]._id,
      cooperative: cooperative._id,
      serviceCategory: catMap['electrical'],
      category: catMap['electrical'],
      tasks: [
        {
          title: 'Ceiling Fan Repair / Capacitor Replace',
          serviceCode: 'ELEC_FAN_REPAIR',
          quantity: 1,
          rate: 199,
          estimatedPrice: 199,
        },
      ],
      requirementInput: {
        rawText: 'Ceiling fan is making humming sound and rotating very slowly in bedroom.',
        audioTranscript: 'कमरे का पंखा बहुत धीमी गति से चल रहा है और गुनगुनाहट की आवाज़ आ रही है।',
        languageDetected: 'hi',
        inputType: 'voice',
        parsedTasks: [
          { taskCode: 'ELEC_FAN_REPAIR', title: 'Ceiling Fan Repair / Capacitor Replace', estimatedUnits: 1, estimatedPrice: 199 },
        ],
      },
      status: 'COMPLETED',
      address: {
        addressLine: 'B-42, Lajpat Nagar II',
        city: 'New Delhi',
        pincode: '110024',
        fullAddress: 'B-42, Lajpat Nagar II, New Delhi 110024',
      },
      location: {
        type: 'Point',
        coordinates: [77.2435, 28.5677],
        addressLine: 'B-42, Lajpat Nagar II',
        city: 'New Delhi',
        pincode: '110024',
      },
      scheduledStart: new Date('2026-09-04T10:00:00Z'),
      scheduledEnd: new Date('2026-09-04T12:00:00Z'),
      initialEstimate: 199,
      finalPrice: 199,
    });

    await BookingStatusHistory.create({
      booking: sampleBooking._id,
      fromStatus: 'priced',
      toStatus: 'completed',
      changedBy: seededWorkers[0]._id,
      reason: 'Job done and payment received',
      timestamp: new Date(),
    });

    // Bill & Payment
    const bill = await Bill.create({
      billNumber: 'BILL-2026-0001',
      booking: sampleBooking._id,
      customer: seededCustomers[0]._id,
      worker: seededWorkers[0]._id,
      lineItems: [
        { serviceCode: 'ELEC_FAN_REPAIR', title: 'Ceiling Fan Repair / Capacitor Replace', quantity: 1, unitRate: 199, subtotal: 199 },
      ],
      grossAmount: 199,
      cooperativeWelfareDeduction: 10, // 5% approx
      workerNetEarnings: 189,
      netPayable: 199,
      billStatus: 'paid',
      customerApproved: true,
    });

    await Payment.create({
      transactionId: 'TXN-UPI-MOCK-998811',
      booking: sampleBooking._id,
      bill: bill._id,
      customer: seededCustomers[0]._id,
      amount: 199,
      paymentMethod: 'mock_upi',
      paymentStatus: 'success',
      paidAt: new Date(),
    });

    // Review
    await Review.create({
      booking: sampleBooking._id,
      customer: seededCustomers[0]._id,
      worker: seededWorkers[0]._id,
      rating: 5,
      punctualityRating: 5,
      qualityRating: 5,
      behaviorRating: 5,
      comment: 'Very polite worker, arrived on time with cooperative ID card and fixed capacitor quickly.',
      tags: ['On time', 'Professional', 'Clean work'],
      cooperativeBadge: 'Master Technician',
    });

    // Welfare Record
    await WelfareRecord.create({
      cooperative: cooperative._id,
      worker: seededWorkers[0]._id,
      booking: sampleBooking._id,
      type: 'contribution_deduction',
      amount: 10,
      description: '5% social security welfare contribution from booking CS-2026-0905-001',
      runningWelfareBalance: 175010,
      date: new Date(),
    });

    // Transaction
    await Transaction.create({
      transactionNumber: 'LEDGER-TXN-10001',
      cooperative: cooperative._id,
      user: seededCustomers[0]._id,
      booking: sampleBooking._id,
      type: 'customer_payment',
      direction: 'credit',
      amount: 199,
      status: 'completed',
      metadata: { billNumber: 'BILL-2026-0001' },
    });

    // 8. Demand Forecast
    console.log('[Seed] Creating Demand Forecast records...');
    await DemandForecast.create({
      cooperative: cooperative._id,
      zone: 'South Delhi',
      serviceCategory: 'electrical',
      category: catMap['electrical'],
      forecastDate: new Date('2026-09-06'),
      dayOfWeek: 'Sunday',
      predictedDemand: 28,
      predictedBookingVolume: 28,
      availableCapacity: 20,
      capacityGap: 8,
      growthTrendPercent: 14.5,
      recommendation: 'Allocate 8 additional electrical technicians for South Delhi zone.',
      confidenceScore: 0.89,
      explanation: 'Monsoon humidity and weekend schedule driven demand peak.',
      factors: {
        season: 'Late Monsoon / High Humidity',
        isWeekend: true,
        historicalAverage: 24,
        workerSupplyAvailable: 20,
      },
    });

    console.log('[Seed] ✅ Database seeding completed successfully!');
    console.log(`[Seed] Summary:
    - 1 Cooperative: ${cooperative.name}
    - 1 Admin: ${adminUser.phone} (Password: CoSathi@2026)
    - ${seededCustomers.length} Customers (Password: CoSathi@2026)
    - ${seededWorkers.length} Workers with Fairness profiles (Password: CoSathi@2026)
      * Worker A: 4.9 rating, 200 completed, 12 recent (overloaded)
      * Worker B: 4.6 rating, 90 completed, 3 recent (underloaded)
      * Worker C: 4.8 rating, 150 completed, 6 recent (balanced)
    - ${categories.length} Service Categories
    - ${rateCardData.length} Rate Card Items
    - Sample Booking, Bill, Mock Payment, Review, Welfare Record, Demand Forecast
    `);

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('[Seed] ❌ Seeding failed with error:', error);
    process.exit(1);
  }
};

runSeed();
