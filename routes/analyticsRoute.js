const express = require("express");
const router = express.Router();
const analyticsController = require("../controller/analyticsController");
const { protect, restrictTo } = require("../controller/authController");

// 🛡 Protect all routes
router.use(protect);

router.get(
  "/seller",
  restrictTo("seller", "admin"),
  analyticsController.getSellerDashboardAnalytics
);

// 📊 Dashboard Analytics
router.get("/", restrictTo("admin"), analyticsController.getDashboardAnalytics);

router.get("/order-analytics", analyticsController.getOrderAnalytics);

module.exports = router;
