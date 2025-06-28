import rateLimit from "express-rate-limit";
export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: "Too many login attempts, please try again later",
});
