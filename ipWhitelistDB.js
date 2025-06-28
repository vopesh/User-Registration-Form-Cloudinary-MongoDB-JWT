// In-memory whitelist DB (can be moved to real DB later)
const ipWhitelist = new Map(); // { ip: expiryTimestamp }

export function whitelistIP(ip, days = 14) {
  const expiry = Date.now() + days * 24 * 60 * 60 * 1000; // 14 days
  ipWhitelist.set(ip, expiry);
}

export function isIPWhitelisted(ip) {
  const expiry = ipWhitelist.get(ip);
  if (!expiry) return false;

  if (Date.now() > expiry) {
    ipWhitelist.delete(ip);
    return false;
  }

  return true;
}
