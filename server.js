import express from "express";
import mongoose from "mongoose";
import helmet from "helmet";
import session from "express-session";
import flash from "connect-flash";
import MongoStore from "connect-mongo";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import userRoutes from "./routes/userRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { idleTimeout } from "./middlewares/authMiddleware.js";
import { logDevStartup } from "./src/utils/devTools.js";
import { logger } from "./src/utils/logger.js";
import apiRoutes from "./routes/apiRoutes.js";
import cookieParser from "cookie-parser";

// Load environment variables
dotenv.config();
const isDev = process.env.NODE_ENV !== "production";

// Initialize Express
const app = express();
app.use(cookieParser());

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdnjs.cloudflare.com",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com",
        ],
        fontSrc: [
          "'self'",
          "https://fonts.googleapis.com",
          "https://fonts.gstatic.com",
          "https://cdnjs.cloudflare.com",
        ],
        connectSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

app.set("trust proxy", 1); // 4️⃣ Required behind proxy in production. in case deploying on a cloud host like Render or Vercel, you may also want to trust the proxy:

// =============================================
// Environment Configurations
// =============================================

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: process.env.CLOUDINARY_SECURE === "true" || !isDev, // Use env variable or auto-set
});

// Conditional dev tools import and debug setup
let devTools;
if (isDev) {
  devTools = await import("./src/utils/devTools.js");
  multer.debug = true;
  console.log("Cloudinary config:", {
    cloud_name: cloudinary.config().cloud_name ? "✅ Configured" : "❌ Missing",
    folder: process.env.CLOUDINARY_UPLOAD_FOLDER,
    secure: cloudinary.config().secure,
  });
}

// Enable trust proxy and security middleware in production
if (!isDev) {
  app.set("trust proxy", 1);
  app.disable("x-powered-by"); // Security best practice
}

// =============================================
// Universal Middleware
// =============================================

// __dirname fix for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static files with cache control
app.use(express.static(path.join(__dirname, "public")));

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Body parsers with size limits
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(express.json({ limit: "100kb" }));

// =============================================
// Database Connection (with improved error handling)
// =============================================

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME,
    serverSelectionTimeoutMS: 5000, // 5 second timeout
    autoIndex: process.env.NODE_ENV !== "production", // only create indexes in dev
  })
  .then(() => {
    logger.info("✅ MongoDB connected");
    if (isDev) {
      mongoose.set("debug", true); // Show queries in dev
    }
  })
  .catch((err) => {
    logger.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // Exit if DB connection fails
  });

// =============================================

if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("❌ SESSION_SECRET is required in production");
}
app.use(
  session({
    //Session Timeout (in server.js):
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      dbName: process.env.DB_NAME,
      collectionName: "sessions",
    }),
    cookie: {
      maxAge: 1000 * 60 * 3, // 3 min
      secure: process.env.NODE_ENV === "production", // only send cookie over HTTPS
      httpOnly: true, // prevent JavaScript access (protects against XSS)
      sameSite: "strict",
    },
    rolling: true,
  })
);

app.use(flash());
// ✅ Global flash middleware to make flash messages available in views
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});

app.use(idleTimeout);

app.use((req, res, next) => {
  // Make loggedIn status available to all views
  res.locals.loggedIn = req.session.userId ? true : false;
  next();
});

// Routes
app.use("/", userRoutes);
// =============================================

// error handler
app.use(errorHandler);

// Request logging and performance tracking (dev only)
if (isDev) {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      logger.info(`${req.method} ${req.url} - ${Date.now() - start}ms`);
    });
    next();
  });
}

// =============================================
// Enhanced Error Handling
// =============================================

app.use((err, req, res, next) => {
  // Log full error in development
  if (isDev) {
    logger.error("⚠️ Error:", {
      message: err.message,
      stack: err.stack,
      ...(err.errors && { errors: err.errors }),
    });
  } else {
    // Production logging (just the essentials)
    logger.error("Error:", err.message);
  }

  // Handle Multer errors
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      error: "FILE_UPLOAD_ERROR",
      message: isDev ? err.message : "Invalid file upload",
    });
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: "VALIDATION_ERROR",
      message: "Validation failed",
      ...(isDev && { details: err.errors }),
    });
  }

  // Generic error response
  res.status(500).json({
    success: false,
    error: "SERVER_ERROR",
    message: isDev ? err.message : "Internal server error",
  });
});

//api calls
app.use("/api", apiRoutes);

// =============================================
// Server Startup
// =============================================

const PORT = process.env.PORT || 1003;
const server = app.listen(PORT, () => {
  if (isDev) {
    devTools.logDevStartup(
      PORT,
      path.join(__dirname, "public/uploads"),
      !!cloudinary.config().cloud_name
    );
  } else {
    logger.info(`🚀 Production server running on port ${PORT}`);
    logger.info(`   - Database: ${process.env.DB_NAME}`);
    logger.info(
      `   - Cloudinary folder: ${process.env.CLOUDINARY_UPLOAD_FOLDER}`
    );
    logDevStartup(PORT, uploadsPath, cloudinaryReady);
  }
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection:", err.message);
  server.close(() => process.exit(1));
});
