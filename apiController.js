import fs from "fs";
import { user } from "../models/users.js";
import { v2 as cloudinary } from "cloudinary";
import bcrypt from "bcryptjs";
import { deletedUser } from "../models/deletedUser.js";

// POST to register
export const apiRegisterUser = async (req, res) => {
  try {
    const { name, email, password, country, countryCode, phone } = req.body;

    // 1. Ensure photo is provided
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Photo is required" });
    }

    // 2. Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "vopesh-lec18-user-profiles",
    });

    // 3. Construct new user (DO NOT hash password manually here!)
    const newUser = new user({
      name,
      email,
      password, // 🔐 Let schema hash this via pre('save')
      country,
      countryCode,
      phone,
      photo: result.public_id,
      cloudinaryURL: result.secure_url,
    });

    // 4. Set raw password explicitly for custom validation
    newUser.rawPassword = password;

    // 5. Save to DB (triggers rawPassword validation + hashing)
    await newUser.save();

    // 6. Cleanup
    fs.unlinkSync(req.file.path);

    // 7. Success response
    res.status(201).json({
      success: true,
      message: "User registered via API",
      data: {
        name: newUser.name,
        email: newUser.email,
        fullPhone: newUser.fullPhone,
        country: newUser.country,
        cloudinaryURL: newUser.cloudinaryURL,
      },
    });
  } catch (error) {
    console.error("❌ API Register Error:", error.message);

    // Optional: Delete temp image on error
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (_) {}
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

// GET all user
// ✅ Get all users with optional filters
export const apiGetAllUsers = async (req, res) => {
  try {
    const { country, name } = req.query;

    const filter = {};

    if (country) {
      filter.country = country.trim().toUpperCase(); // Ensure uppercase match
    }

    if (name) {
      filter.name = new RegExp(name.trim(), "i"); // Case-insensitive partial match
    }

    console.log("🔎 Applied Filter:", filter); // Debug filter in terminal

    const users = await user
      .find(filter)
      .select("name email country fullPhone cloudinaryURL createdAt userId");

    res.status(200).json({
      success: true,
      total: users.length,
      users,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: err.message,
    });
  }
};

// GET user by user_id
// ✅ Get single user by userId
export const apiGetUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const foundUser = await user
      .findOne({ userId: id })
      .select("name email country fullPhone cloudinaryURL createdAt userId");

    if (!foundUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: foundUser,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching user",
    });
  }
};

/*
URL: PUT /api/update/:userId

Fields: Allow updating any of these (optional in request body): name, email, country, countryCode, phone

Password/photo won’t be updated via this PUT (use PATCH for those later)

Return updated user (excluding password)
*/

//✅ Goal: PUT /api/update/:userId

export const apiUpdateUser = async (req, res) => {
  const { userId } = req.params;

  // Only allow specific fields to be updated
  const allowedUpdates = ["name", "email", "phone", "country", "countryCode"];
  const updates = {};

  for (let key of allowedUpdates) {
    if (req.body[key]) {
      updates[key] = req.body[key];
    }
  }

  // ✅ Add tracking fields
  updates.lastUpdatedAt = new Date();
  updates.lastUpdatedIP =
    req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  console.log("✅ Updates to apply:", updates); // Debug print

  try {
    const updatedUser = await user
      .findOneAndUpdate({ userId }, updates, {
        new: true,
        runValidators: true,
        context: "query",
      })
      .select("-password"); //if you explicitly fetch with .findOneAndUpdate(), Mongoose might return everything. So this ensures password is not leaked in API response.

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error("❌ Update error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Step 3: Add DELETE controller

export const apiDeleteUser = async (req, res) => {
  const { userId } = req.params;
  const deletedByIP = req.ip;

  try {
    // 1. Find user
    const existingUser = await user.findOne({ userId }).select("-password");

    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (existingUser.isDeleted) {
      return res
        .status(400)
        .json({ success: false, message: "User already deleted" });
    }

    // 2. Mark user as deleted (soft delete)
    existingUser.isDeleted = true;
    await existingUser.save();

    // 3. Store copy in deleted collection (except password)
    /*
    existingUser.toObject() converts the Mongoose document into a plain JavaScript object.

... spreads all the properties (like name, email, photo, etc.) into the new object.

Then we override/add two extra fields:

deletedAt: new Date()

deletedByIP
    */
    const deletedEntry = new deletedUser({
      ...existingUser.toObject(),
      deletedAt: new Date(),
      deletedByIP,
    });
    await deletedEntry.save();

    res.json({ success: true, message: "User soft-deleted" });
  } catch (err) {
    console.error("❌ Delete Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH (revoke)

export const apiRevokeUser = async (req, res) => {
  const { userId } = req.params;

  try {
    // 1. Find in deletedUser archive
    const archivedUser = await deletedUser.findOne({ userId });

    if (!archivedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found in deleted archive or already expired",
      });
    }

    // 2. Check if within 24 hours
    const now = new Date();
    const timeSinceDeletion = now - archivedUser.deletedAt;

    if (timeSinceDeletion > 24 * 60 * 60 * 1000) {
      return res.status(403).json({
        success: false,
        message: "Revoke window expired. User cannot be restored.",
      });
    }

    // 3. Restore in main collection
    const restoredUser = await user.findOneAndUpdate(
      { userId },
      { isDeleted: false },
      { new: true }
    );

    if (!restoredUser) {
      return res.status(404).json({
        success: false,
        message: "Original user not found in main collection",
      });
    }

    // 4. Remove from deletedUser collection
    await deletedUser.deleteOne({ userId });

    res.status(200).json({
      success: true,
      message: "User successfully restored",
      user: {
        userId: restoredUser.userId,
        name: restoredUser.name,
        email: restoredUser.email,
        isDeleted: restoredUser.isDeleted,
      },
    });
  } catch (err) {
    console.error("Revoke error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
