import { user } from "../models/users.js";
// Protect private routes (e.g., profile, dashboard)

// 🔒 Middleware: Allow only logged-in users
// 🔒 Enhanced Middleware: Allow only if session is valid and matches DB
export const isAuthenticated = async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const foundUser = await user
        .findById(req.session.userId)
        .select("loginStatus sessionId");

      if (!foundUser || foundUser.loginStatus !== "on") {
        req.flash("error_msg", "Session expired or you logged in elsewhere.");
        req.session.destroy(() => res.redirect("/login")); // ← this works even in edge case
        return;
      }

      // 🔐 Check if sessionId matches
      if (foundUser.sessionId !== req.session.id) {
        req.flash(
          "error_msg",
          "Session invalid. You may be logged in from another device."
        );
        req.session.destroy(() => res.redirect("/login"));
        return;
      }

      return next(); // ✅ All checks passed
    } catch (err) {
      console.error("Auth check error:", err);
      req.flash("error_msg", "Authentication error");
      return res.redirect("/login");
    }
  }

  return res.redirect("/login");
};

// 🚫 Middleware: Block login/register if already logged in
export const isNotAuthenticated = (req, res, next) => {
  if (req.session?.userId && req.session?.userData) {
    return res.redirect("/profile"); // 🔁 Already logged in → go to profile
  }
  return next(); // ✅ Let unauthenticated users continue to / or /login
};

// ⏱️ Middleware: Auto-logout after inactivity (only for non-remembered sessions)
export const idleTimeout = (req, res, next) => {
  const now = Date.now();
  const idleLimit = 1000 * 60 * 2; // 2 minutes

  // Only apply idle timeout for short sessions
  if (req.session.userId) {
    const lastAccess = req.session.lastAccess || now;

    if (now - lastAccess > idleLimit) {
      console.log("⏱️ Session expired due to inactivity");
      req.flash("error_msg", "Session expired due to inactivity.");
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        }
        return res.redirect("/login");
      });
    } else {
      req.session.lastAccess = now; // 🟢 Update last activity
      next();
    }
  } else {
    next(); // ✅ Continue if remembered OR not logged in
  }
};
