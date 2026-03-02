export default function requireAuth(req, res, next) {
  // ✅ Supports both:
  // - new Clerk: req.auth() returns object
  // - old Clerk: req.auth is object
  const auth = typeof req.auth === "function" ? req.auth() : req.auth;

  if (!auth?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // optional helpers
  req.clerkId = auth.userId;
  req.authData = auth;

  next();
}
