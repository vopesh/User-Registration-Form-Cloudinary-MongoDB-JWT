import express from "express";
import { whitelistCurrentIP } from "../controllers/ipWhitelistController.js";

import {
  getHomePage,
  getUserList,
  loginpage,
  registerUser,
  loginUser,
  logoutUser,
} from "../controllers/userController.js";
import { ipLimiter, ipBlockCheck } from "../middlewares/ipLimiter.js";

import upload from "../middlewares/multerConfig.js";
import {
  isAuthenticated,
  isNotAuthenticated,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// 🏠 Home page
router.get("/", isNotAuthenticated, getHomePage);

// 👥 User list page
router.get("/user-list", isAuthenticated, getUserList);

// login user
router.get("/login", isNotAuthenticated, loginpage);

// Apply rate limiting only to login route
router.post("/login", ipBlockCheck, ipLimiter, loginUser);

router.get("/profile", isAuthenticated, (req, res) => {
  const userData = req.session.userData;
  const isRemembered = req.session.isRemembered || false;
  res.render("profile.ejs", { user: userData, isRemembered });
});

router.post("/whitelist-ip", isAuthenticated, whitelistCurrentIP);

router.get("/logout", isAuthenticated, logoutUser);

// Register user (with file upload)
router.post(
  "/register",
  (req, res, next) => {
    console.log("Request received at /register");
    next();
  },
  upload.single("photo"),
  registerUser
);

export default router;
