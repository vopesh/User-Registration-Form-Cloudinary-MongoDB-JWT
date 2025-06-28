import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { user } from "../models/users.js";
import { RefreshModel } from "../models/refreshToken.js";

// Token helper
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "15m",
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    algorithm: "HS256",
    expiresIn: "7d",
  });
};

export const apiLoginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const foundUser = await user.findOne({ email }).select("+password");

    if (!foundUser) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Generate tokens
    const payload = { userId: foundUser._id, email: foundUser.email };

    // 🧹 Clean up old refresh tokens for this user
    await RefreshModel.deleteMany({ userId: foundUser.userId });

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save refresh token to DB
    await RefreshModel.create({
      userId: foundUser.userId,
      token: refreshToken,
    });

    // Store refresh token in DB if needed or just send as cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
    });
  } catch (err) {
    console.error("❌ API login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
