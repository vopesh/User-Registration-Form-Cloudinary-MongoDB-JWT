import mongoose from "mongoose";

const deletedUserSchema = new mongoose.Schema(
  {
    userId: String,
    name: String,
    email: String,
    phone: String,
    fullPhone: String,
    country: String,
    countryCode: String,
    photo: String,
    cloudinaryURL: String,
    createdAt: Date,

    deletedAt: {
      type: Date,
      default: Date.now, // Required for TTL
    },
    deletedByIP: String,
  },
  { versionKey: false }
);

// TTL: 24 hours after `deletedAt`
deletedUserSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 86400 });

export const deletedUser =
  mongoose.models.lec18_deleted_user ||
  mongoose.model("lec18_deleted_user", deletedUserSchema);
