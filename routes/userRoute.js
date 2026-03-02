const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const { protect, restrictTo } = require("../controller/authController");

// (Optional) If you want to protect with auth later, uncomment below
// router.use(protect);
// router.use(restrictTo("admin"));

// 📋 Routes
router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

// ✅ Approve user
router.patch("/:id/approve", userController.approveUser);

// 🚫 Ban user
router.patch("/:id/ban", userController.banUser);

module.exports = router;
