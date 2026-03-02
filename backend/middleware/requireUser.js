import User from "../models/User.js";

export default async function requireUser(req, res, next) {
  try {
    // Support multiple styles (your project uses different versions sometimes)
    const clerkId =
      req.clerkId ||
      req.auth?.userId ||
      req.auth?.clerkUserId ||
      req.authData?.userId;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized (no clerkId)" });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res
        .status(401)
        .json({ message: "User not found in DB. Call /api/users/sync first." });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("requireUser error:", err);
    return res.status(500).json({ message: "Failed to load user" });
  }
}
