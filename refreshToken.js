import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema({
  //userId: { type: mongoose.Schema.Types.ObjectId, ref: "lec18_auth" },
  userId: { type: String, required: true },
  token: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7 * 24 * 60 * 60, // Auto-delete in 7 days
  },
});

export const RefreshModel =
  mongoose.models.RefreshToken ||
  mongoose.model("RefreshToken", refreshTokenSchema);
