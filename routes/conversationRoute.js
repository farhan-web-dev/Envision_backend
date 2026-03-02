const express = require("express");
const router = express.Router();
const messageController = require("../controller/conversationController");
const { protect } = require("../controller/authController");
const upload = require("../config/multer");

// ✅ Protect all message routes
router.use(protect);

// ✅ Static or specific routes (MUST come before dynamic ones)
router.get("/unread-counts", messageController.getUnreadMessagesCount);
router.get(
  "/:sender/:receiver/messages",
  messageController.getMessagesBetweenUsers
);

// ✅ Core CRUD routes
router.get("/", messageController.getUserConversations); // all conversations
router.post("/", upload.array("attachments", 5), messageController.sendMessage); // send/create
router.get("/:id", messageController.getConversation); // single conversation
router.patch("/:id/mark-read", messageController.markMessagesAsRead); // mark as read

module.exports = router;
