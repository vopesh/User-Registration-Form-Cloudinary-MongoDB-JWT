//models/whitelistedIP.js
/*
ipHash: This will store the hashed version of the user's IP.

createdAt: MongoDB will automatically delete the document 14 days after creation using the expires option.

We do not store raw IPs — only hashed versions.

*/
import mongoose from "mongoose";

const whitelistedIPSchema = new mongoose.Schema(
  {
    ipHash: {
      type: String,
      required: true,
      unique: true, // Ensure only one entry per IP hash
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 30, //60 * 60 * 24 * 14, // 14 days (in seconds). 60 * 30 -- 30 min, 60 * 60 * 24- 1 day
    },
  },
  { versionKey: false }
);

export const WhitelistedIP = mongoose.model(
  "WhitelistedIP",
  whitelistedIPSchema
);
