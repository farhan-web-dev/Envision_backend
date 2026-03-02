const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notificationController");
const { protect } = require("../controller/authController");

// ✅ All routes protected for authenticated users
router.use(protect);

// Get all notifications for the logged-in user
router.get("/", notificationController.getUserNotifications);

// Create a new notification (admin or system can call this)
router.post("/", notificationController.createNotification);

// Mark single notification as read
router.patch("/:id/read", notificationController.markAsRead);

// Mark all as read
router.patch("/mark-all-read", notificationController.markAllAsRead);

// Delete a notification
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;
