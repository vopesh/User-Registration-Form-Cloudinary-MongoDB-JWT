import { networkInterfaces } from "os";

/**
 * Returns all network IP addresses
 * @returns {Object} Network IP information
 */
export function getNetworkInfo() {
  const nets = networkInterfaces();
  const results = {};

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(net.address);
      }
    }
  }

  return results;
}

/**
 * Gets primary local IP address
 * @returns {string} Local IP address
 */
export function getLocalIp() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

/**
 * Development startup logger
 */
export function logDevStartup(port, uploadsPath, cloudinaryReady) {
  console.log("\n" + "=".repeat(50));
  console.log("🚀 Development Server Info:");
  console.log(`- Local: http://localhost:${port}`);
  console.log(`- Network: http://${getLocalIp()}:${port}`);
  console.log(`📁 Temp uploads directory: ${uploadsPath}`);
  console.log(`☁️ Cloudinary: ${cloudinaryReady ? "✅ Ready" : "❌ Missing"}`);
  console.log("\n🔧 Development Features:");
  console.log("- Multer temp files saved locally");
  console.log("- HTTPS is disabled");
  console.log("- Detailed error messages enabled");
  console.log("=".repeat(50) + "\n");
}
