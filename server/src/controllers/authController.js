const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  User,
  CustomerProfile,
  WorkerProfile,
  WorkerAvailability,
  WorkerLocation,
  WorkerPerformance,
  Cooperative,
} = require('../models');

// Helper to sign JWT
const signToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'cosathi_sih2026_super_secure_jwt_secret_key_998877',
    { expiresIn: '30d' }
  );
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      email,
      password,
      role = 'customer',
      preferredLanguage = 'en',
      // Customer specific
      address,
      // Worker specific
      primarySkill,
      experienceYears,
      aadhaarNumber,
      coordinates,
    } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, phone number, and password.',
      });
    }

    // Check if phone or email already registered
    const existingUser = await User.findOne({
      $or: [{ phone }, ...(email ? [{ email }] : [])],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this phone number or email already exists.',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Get active cooperative
    const cooperative = await Cooperative.findOne({ status: 'active' });
    if (!cooperative && role !== 'customer') {
      return res.status(400).json({
        success: false,
        message: 'No active cooperative found to associate worker or admin.',
      });
    }

    // Create User
    const user = await User.create({
      name,
      phone,
      email: email || undefined,
      password: hashedPassword,
      role,
      preferredLanguage,
      status: 'active',
    });

    let profileData = null;

    // Role-specific profile initialization
    if (role === 'customer') {
      const coords = coordinates && coordinates.length === 2 ? coordinates : [77.2435, 28.5677];
      profileData = await CustomerProfile.create({
        user: user._id,
        defaultAddress: {
          tag: 'Home',
          street: address || 'South Delhi, New Delhi',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110024',
          location: {
            type: 'Point',
            coordinates: coords,
          },
        },
      });
    } else if (role === 'worker') {
      const coords = coordinates && coordinates.length === 2 ? coordinates : [77.2410, 28.5650];
      const memberNumber = Math.floor(1000 + Math.random() * 9000);
      const maskedAadhaar = aadhaarNumber
        ? `XXXX-XXXX-${aadhaarNumber.slice(-4)}`
        : `XXXX-XXXX-${Math.floor(1000 + Math.random() * 9000)}`;

      profileData = await WorkerProfile.create({
        user: user._id,
        cooperative: cooperative._id,
        memberId: `COS-DL-2026-${memberNumber}`,
        primarySkill: primarySkill || 'electrical',
        skills: [
          {
            category: primarySkill || 'electrical',
            subSkills: ['General Diagnostics', 'Installation & Repair'],
            experienceYears: Number(experienceYears) || 2,
          },
        ],
        experienceYears: Number(experienceYears) || 2,
        verificationStatus: 'approved',
        aadhaarVerification: {
          maskedNumber: maskedAadhaar,
          isSimulated: true,
          verifiedAt: new Date(),
          notes: 'Simulated physical cooperative in-person verification',
        },
        homeBaseLocation: {
          type: 'Point',
          coordinates: coords,
        },
      });

      await WorkerAvailability.create({
        worker: user._id,
        isOnDuty: true,
        currentStatus: 'idle',
      });

      await WorkerLocation.create({
        worker: user._id,
        location: {
          type: 'Point',
          coordinates: coords,
        },
      });

      await WorkerPerformance.create({
        worker: user._id,
        cooperative: cooperative._id,
        lifetimeJobsCompleted: 0,
        jobsCompletedLast7Days: 0,
        averageRating: 5.0,
        totalRatingsCount: 0,
        fairDistributionScore: 1.0, // Fresh workers start with full fairness priority!
      });
    } else if (role === 'cooperative_admin') {
      if (cooperative) {
        cooperative.admins.push(user._id);
        await cooperative.save();
      }
    }

    const token = signToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        status: user.status,
      },
      profile: profileData,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide mobile number or email and password.',
      });
    }

    // Match by phone OR email
    const user = await User.findOne({
      $or: [{ phone: identifier }, { email: identifier.toLowerCase() }],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended. Please contact cooperative management.',
      });
    }

    // Fetch associated profile
    let profile = null;
    if (user.role === 'customer') {
      profile = await CustomerProfile.findOne({ user: user._id });
    } else if (user.role === 'worker') {
      profile = await WorkerProfile.findOne({ user: user._id }).populate('cooperative', 'name registrationNumber');
    }

    const token = signToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        status: user.status,
      },
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    let profile = null;
    let extra = {};

    if (user.role === 'customer') {
      profile = await CustomerProfile.findOne({ user: user._id });
    } else if (user.role === 'worker') {
      profile = await WorkerProfile.findOne({ user: user._id }).populate('cooperative', 'name registrationNumber');
      const availability = await WorkerAvailability.findOne({ worker: user._id });
      const performance = await WorkerPerformance.findOne({ worker: user._id });
      extra = { availability, performance };
    } else if (user.role === 'cooperative_admin') {
      const cooperative = await Cooperative.findOne({ admins: user._id });
      extra = { cooperative };
    }

    res.status(200).json({
      success: true,
      user,
      profile,
      ...extra,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/language
const updateLanguage = async (req, res, next) => {
  try {
    const { language } = req.body;
    if (!['en', 'hi'].includes(language)) {
      return res.status(400).json({
        success: false,
        message: "Invalid language. Allowed values are 'en' or 'hi'.",
      });
    }

    req.user.preferredLanguage = language;
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Language preference updated.',
      preferredLanguage: language,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

module.exports = {
  register,
  login,
  getMe,
  updateLanguage,
  logout,
};
