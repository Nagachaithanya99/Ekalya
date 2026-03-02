import User from "../models/User.js";
import Notification from "../models/Notification.js";

const normalizePayload = (payload = {}) => ({
  type: payload.type || "system",
  title: String(payload.title || "Notification").trim(),
  message: String(payload.message || "").trim(),
  link: String(payload.link || "").trim(),
  meta: payload.meta || {},
  createdBy: payload.createdBy || null,
});

export const notifyUser = async (userId, payload = {}) => {
  if (!userId) return null;
  const user = await User.findById(userId).select("_id role");
  if (!user) return null;

  const data = normalizePayload(payload);
  if (!data.message) return null;

  return Notification.create({
    userId: user._id,
    role: user.role,
    ...data,
  });
};

export const notifyRole = async (role, payload = {}, options = {}) => {
  const data = normalizePayload(payload);
  if (!data.message) return 0;

  const excludeUserIds = (options.excludeUserIds || []).map(String);
  const users = await User.find({ role }).select("_id role").lean();
  if (!users.length) return 0;

  const docs = users
    .filter((u) => !excludeUserIds.includes(String(u._id)))
    .map((u) => ({
      userId: u._id,
      role: u.role,
      ...data,
    }));

  if (!docs.length) return 0;
  await Notification.insertMany(docs, { ordered: false });
  return docs.length;
};

export const notifyStudents = (payload = {}, options = {}) =>
  notifyRole("student", payload, options);

export const notifyAdmins = (payload = {}, options = {}) =>
  notifyRole("admin", payload, options);
