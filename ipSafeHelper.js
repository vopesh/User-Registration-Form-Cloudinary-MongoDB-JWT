import { WhitelistedIP } from "../../models/whitelistedIP.js";
import { hashIP } from "./hashIP.js";

// Save hashed IP with expiry of 14 days
export async function whitelistIP(req) {
  const hashedIP = hashIP(req.ip);
  try {
    await WhitelistedIP.findOneAndUpdate(
      { hashedIP },
      { hashedIP }, // No need to update fields, just ensure upsert
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return true;
  } catch (err) {
    logger.error("Error whitelisting IP:", err);
    return false;
  }
}
