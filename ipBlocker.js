// utils/ipBlocker.js
const blockedIPs = new Map(); // key: IP, value: timestamp

// Duration: 2 hours in ms
//const BLOCK_DURATION = 2 * 60 * 60 * 1000;
const BLOCK_DURATION = 2 * 60 * 1000;

export const isIPBlocked = (ip) => {
  const blockTime = blockedIPs.get(ip);
  if (!blockTime) return false;

  const now = Date.now();
  const diff = now - blockTime;
  if (diff > BLOCK_DURATION) {
    blockedIPs.delete(ip); // unblock after 2 hrs
    return false;
  }

  return true;
};

export const blockIP = (ip) => {
  blockedIPs.set(ip, Date.now());
};
