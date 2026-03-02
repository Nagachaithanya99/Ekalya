import User from "../models/User.js";

/**
 * GET /api/users/me
 * Returns logged-in user's DB record (role, email, name, etc.)
 */
export const getMe = async (req, res, next) => {
  try {
    // ✅ requireAuth already verified login
    // ✅ req.user is attached in server.js middleware
    const user = req.user;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      clerkId: user.clerkId,
      name: user.name || "",
      email: user.email || "",
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/me/role
 * Admin-only
 */
export const updateMyRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!["student", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // ✅ Use req.user / req.clerkId (not req.auth.userId)
    const clerkId = req.user?.clerkId;
    if (!clerkId) return res.status(401).json({ message: "Unauthorized" });

    const updated = await User.findOneAndUpdate(
      { clerkId },
      { role },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "User not found" });

    res.json({
      clerkId: updated.clerkId,
      email: updated.email,
      role: updated.role,
    });
  } catch (err) {
    next(err);
  }
};
