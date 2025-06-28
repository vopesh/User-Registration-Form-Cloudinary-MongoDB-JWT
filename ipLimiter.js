import rateLimit from "express-rate-limit";
import { logger } from "../src/utils/logger.js";
import { isIPBlocked, blockIP } from "../src/utils/ipBlocker.js";

// 🟢 In-memory whitelist (can be enhanced later with DB persistence)
const whitelistedIPs = new Set();

// 🔓 Function to whitelist current IP
export const enableIPWhitelist = (ip) => {
  whitelistedIPs.add(ip);
  logger.info(`🟢 IP ${ip} added to whitelist (safe IP)`);
};

// 🔍 Check if IP is whitelisted
export const isIPWhitelisted = (ip) => whitelistedIPs.has(ip);

// 🚦 Middleware to skip limiter if IP is safe
export const ipBlockCheck = (req, res, next) => {
  const userIP = req.ip;
  if (isIPWhitelisted(userIP)) {
    logger.info(`🟢 Safe IP ${userIP} detected — skipping block check`);
    return next(); // Bypass if safe
  }

  if (isIPBlocked(userIP)) {
    logger.warn(`🔒 IP ${userIP} is currently blocked`);
    return res.redirect("/login?limit=ip");
  }

  next(); // Not blocked, not whitelisted — proceed
};

// 🔐 Apply brute force protection (unless IP is safe)
export const ipLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 10,
  skipSuccessfulRequests: false, // block even if credentials are correct
  keyGenerator: (req) => req.ip, // Use IP for rate limiting
  handler: (req, res) => {
    const ip = req.ip;

    if (isIPWhitelisted(ip)) {
      logger.info(`🟢 Whitelisted IP ${ip} bypassed rate limit`);
      return res.redirect("/login"); // allow access
    }

    logger.warn(`🔴 IP ${ip} exceeded max attempts. Blocking for 2 hours.`);
    blockIP(ip); // ❌ Add to block list
    return res.redirect("/login?limit=ip");
  },
});
