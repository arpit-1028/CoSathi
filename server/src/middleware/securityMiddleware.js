/**
 * CoSathi Security Middleware Suite (Phase 16 Technical Audit)
 * Provides:
 * 1. MongoDB / NoSQL Query Injection Protection (mongoSanitize)
 * 2. In-Memory Sliding Window Rate Limiting (auth & general API limiters)
 * 3. HTTP Security Headers
 * 4. Input & File Upload Validation
 * 5. Role Escalation Protection
 */

/**
 * 1. MongoDB Query Injection Protection
 * Recursively strips keys starting with '$' or containing '.' from req.body, req.query, and req.params
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Block keys starting with $ (MongoDB query operators like $gt, $ne, $where)
    // and keys containing dot (.) notation
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    sanitized[key] = typeof value === 'object' && value !== null ? sanitizeObject(value) : value;
  }
  return sanitized;
};

const mongoSanitize = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};

/**
 * 2. In-Memory Sliding Window Rate Limiter
 */
const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests, please try again later.' }) => {
  const requests = new Map();

  return (req, res, next) => {
    if (process.env.NODE_ENV === 'test' && req.headers['x-bypass-rate-limit']) {
      return next();
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const windowStart = now - windowMs;

    let timestamps = requests.get(ip) || [];
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= max) {
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: Math.ceil(windowMs / 1000),
      });
    }

    timestamps.push(now);
    requests.set(ip, timestamps);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - timestamps.length));

    next();
  };
};

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

const generalApiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 600,
  message: 'API rate limit exceeded. Please throttle your requests.',
});

/**
 * 3. HTTP Security Headers
 */
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
};

/**
 * 4. Role Escalation Guard for Registration
 */
const guardRegistrationRole = (req, res, next) => {
  const requestedRole = (req.body?.role || '').toLowerCase().trim();
  const FORBIDDEN_REGISTRATION_ROLES = ['cooperative_admin', 'admin', 'supervisor', 'system'];

  if (FORBIDDEN_REGISTRATION_ROLES.includes(requestedRole)) {
    const inviteSecret = req.headers?.['x-admin-invite-secret'] || req.body?.adminInviteSecret;
    const validSecret = process.env.ADMIN_INVITE_SECRET || 'cosathi_coop_admin_sih2026_invite_key';

    if (!inviteSecret || inviteSecret !== validSecret) {
      return res.status(403).json({
        success: false,
        message: `Privilege escalation blocked: Role '${requestedRole}' cannot be assigned through public registration without valid administrative invitation.`,
      });
    }
  }

  if (!['customer', 'worker', 'cooperative_admin'].includes(requestedRole)) {
    req.body.role = 'customer';
  }

  next();
};

/**
 * 5. File Upload Validation (for dispute evidence & worker KYC documents)
 */
const validateFileUpload = ({ allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], maxSizeBytes = 5 * 1024 * 1024 }) => {
  return (req, res, next) => {
    const files = req.files || (req.file ? [req.file] : []);
    for (const file of files) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `Invalid file type '${file.mimetype}'. Allowed: ${allowedMimeTypes.join(', ')}`,
        });
      }
      if (file.size > maxSizeBytes) {
        return res.status(400).json({
          success: false,
          message: `File size ${Math.round(file.size / 1024)}KB exceeds maximum allowable limit of ${Math.round(maxSizeBytes / (1024 * 1024))}MB.`,
        });
      }
    }
    next();
  };
};

module.exports = {
  mongoSanitize,
  createRateLimiter,
  authRateLimiter,
  generalApiRateLimiter,
  securityHeaders,
  guardRegistrationRole,
  validateFileUpload,
};
