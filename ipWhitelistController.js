import { WhitelistedIP } from "../models/whitelistedIP.js";
import { hashIP } from "../src/utils/hashIP.js";
import { logger } from "../src/utils/logger.js";

export const whitelistCurrentIP = async (req, res) => {
  try {
    const ip = req.ip;
    const ipHash = hashIP(ip);

    const exists = await WhitelistedIP.findOne({ ipHash });
    if (!exists) {
      await WhitelistedIP.create({ ipHash });
      logger.info(`✅ IP whitelisted: ${ip} (hashed)`);
      return res.status(200).send("This IP has been marked safe for 14 days.");
    } else {
      return res.status(200).send("This IP is already marked safe.");
    }
  } catch (err) {
    logger.error("Error whitelisting IP:", err);
    return res.status(500).send("Something went wrong. Please try again.");
  }
};
