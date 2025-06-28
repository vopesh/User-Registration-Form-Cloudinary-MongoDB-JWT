import jwt from "jsonwebtoken";
import { RefreshModel } from "../models/refreshToken.js";

export const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const tokenInDB = await RefreshModel.findOne({
      userId: decoded.userId,
      token: refreshToken,
    });

    if (!tokenInDB) {
      return res.status(403).json({ message: "Refresh token not recognized" });
    }

    // Optional: check against DB if you're storing refresh tokens
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      process.env.JWT_SECRET,
      { algorithm: "HS256", expiresIn: "15m" }
    );

    return res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    console.error("❌ Refresh token invalid:", err);
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token" });
  }
};

export const logoutUserAPI = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      await RefreshModel.deleteOne({
        userId: decoded.userId,
        token: refreshToken,
      });
    } catch (err) {
      console.warn("Refresh token invalid during logout.");
    }
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });

  return res.status(200).json({ message: "Logged out successfully" });
};
