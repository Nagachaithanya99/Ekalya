import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireUser from "../middleware/requireUser.js";
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/my", requireAuth, requireUser, getMyNotifications);
router.patch("/read-all", requireAuth, requireUser, markAllNotificationsRead);
router.patch("/:id/read", requireAuth, requireUser, markNotificationRead);

export default router;
