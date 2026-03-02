import mongoose from "mongoose";
import Notification from "../models/Notification.js";

const parseBoolean = (v) => ["true", "1", "yes"].includes(String(v || "").toLowerCase());

export const getMyNotifications = async (req, res, next) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const unreadOnly = parseBoolean(req.query.unreadOnly);

    const baseQuery = { userId: req.user._id };
    if (unreadOnly) baseQuery.isRead = false;

    const [items, total, unreadCount] = await Promise.all([
      Notification.find(baseQuery)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments(baseQuery),
      Notification.countDocuments({ userId: req.user._id, isRead: false }),
    ]);

    return res.json({
      items,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }

    const updated = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Notification not found" });
    return res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });
    const result = await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    return res.json({ updated: result.modifiedCount || 0 });
  } catch (err) {
    next(err);
  }
};
