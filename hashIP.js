/*
This will allow us to store hashed IPs in MongoDB for privacy compliance, while still tracking and comparing them consistently.
🔒 This uses SHA-256 to securely hash the IP address.

Same IP will always produce the same hash (deterministic).

Hashed IP is safe to store in MongoDB (privacy-friendly).


*/

// src/utils/hashIP.js
import crypto from "crypto";

export function hashIP(ip) {
  return crypto.createHash("sha256").update(ip).digest("hex");
}
