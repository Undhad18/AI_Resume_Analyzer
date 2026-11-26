const registrationCounts = new Map();
const loginCounts = new Map();

/**
 * Registration rate limiter middleware
 * Limits registrations per IP window to prevent spam and credential abuse
 */
export const registrationLimiter = (req, res, next) => {
    if (process.env.NODE_ENV === "test") {
        return next();
    }

    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 30; // 30 requests per window
    const now = Date.now();

    const record = registrationCounts.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
        record.count = 0;
        record.resetTime = now + windowMs;
    }

    record.count += 1;
    registrationCounts.set(ip, record);

    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - record.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));

    if (record.count > maxRequests) {
        return res.status(429).json({
            success: false,
            message: "Too many registration attempts from this IP. Please try again later.",
            errors: null
        });
    }

    next();
};

/**
 * Login rate limiter middleware
 * Limits login attempts per IP window to mitigate brute-force attacks
 */
export const loginLimiter = (req, res, next) => {
    if (process.env.NODE_ENV === "test") {
        return next();
    }

    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 20; // 20 requests per window
    const now = Date.now();

    const record = loginCounts.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
        record.count = 0;
        record.resetTime = now + windowMs;
    }

    record.count += 1;
    loginCounts.set(ip, record);

    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - record.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));

    if (record.count > maxRequests) {
        return res.status(429).json({
            success: false,
            message: "Too many login attempts from this IP. Please try again after 15 minutes.",
            errors: null
        });
    }

    next();
};

const builderAiCounts = new Map();

/**
 * Rate limiter for Resume Builder Advanced AI content generation requests (Lesson 8.3)
 */
export const builderAiLimiter = (req, res, next) => {
    // If request mode is "free", skip AI rate limiting
    if (req.body?.mode === "free") {
        return next();
    }

    if (process.env.NODE_ENV === "test" && !req.headers["x-test-rate-limit"]) {
        return next();
    }

    const key = req.user?.id ? `user_${req.user.id}` : (req.ip || req.headers["x-forwarded-for"] || "127.0.0.1");
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 25; // 25 AI generation requests per window
    const now = Date.now();

    const record = builderAiCounts.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
        record.count = 0;
        record.resetTime = now + windowMs;
    }

    record.count += 1;
    builderAiCounts.set(key, record);

    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - record.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));

    if (record.count > maxRequests) {
        return res.status(429).json({
            success: false,
            message: "AI generation rate limit exceeded. Please wait a few minutes or switch to 100% Free Mode.",
            errors: null
        });
    }

    next();
};
