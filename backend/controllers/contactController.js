import mongoose from "mongoose";
import ContactMessage from "../models/ContactMessage.js";
import { notifyAdmins } from "../services/notificationService.js";

const safeNotify = async (promise) => {
  try {
    await promise;
  } catch (err) {
    console.error("Notification error:", err?.message || err);
  }
};

/* PUBLIC: POST /api/contact */
export const sendMessage = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "name, email, message required" });
    }

    const saved = await ContactMessage.create({
      name: String(name).trim(),
      email: String(email).trim(),
      subject: subject ? String(subject).trim() : "",
      message: String(message).trim(),
      status: "unread",
    });

    safeNotify(
      notifyAdmins({
        type: "message",
        title: "New Contact Message",
        message: `${saved.name} sent a message: ${saved.subject || "General inquiry"}`,
        link: "/admin/messages",
        meta: { messageId: String(saved._id), email: saved.email },
      })
    );

    res.status(201).json({ message: "Message sent", id: saved._id });
  } catch (err) {
    next(err);
  }
};

/* ADMIN: GET /api/admin/messages */
export const getAllMessages = async (req, res, next) => {
  try {
    const msgs = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(msgs);
  } catch (err) {
    next(err);
  }
};

/* ADMIN: PATCH /api/admin/messages/:id/read */
export const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ✅ prevent CastError
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid message id" });
    }

    const updated = await ContactMessage.findByIdAndUpdate(
      id,
      { status: "read" },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Message not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

/* ADMIN: DELETE /api/admin/messages/:id */
export const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ✅ prevent CastError
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid message id" });
    }

    const deleted = await ContactMessage.findByIdAndDelete(id);

    if (!deleted) return res.status(404).json({ message: "Message not found" });
    res.json({ message: "Message deleted" });
  } catch (err) {
    next(err);
  }
};
