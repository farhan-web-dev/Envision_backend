const express = require("express");
const router = express.Router();
const transactionController = require("../controller/transactionController");
const { protect, restrictTo } = require("../controller/authController");

// Protect all routes
router.use(protect);

// ✅ Create transaction (after order payment)
router.post("/", transactionController.createTransaction);

// ✅ Get all transactions (user sees own, admin sees all)
router.get("/", transactionController.getAllTransactions);

// ✅ Get single transaction
router.get("/:id", transactionController.getTransaction);

// ✅ Update transaction (e.g. status change)
router.patch(
  "/:id",
  restrictTo("admin"),
  transactionController.updateTransaction
);

// ✅ Delete transaction (optional, admin only)
router.delete(
  "/:id",
  restrictTo("admin"),
  transactionController.deleteTransaction
);

module.exports = router;
