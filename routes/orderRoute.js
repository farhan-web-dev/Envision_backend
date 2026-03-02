const express = require("express");
const orderController = require("../controller/orderController");
const { protect, restrictTo } = require("../controller/authController");

const router = express.Router();

// 🛡 Protect all routes
router.use(protect);

router
  .route("/")
  .get(restrictTo("admin", "seller"), orderController.getAllOrders)
  .post(orderController.createOrder);

router
  .route("/:id")
  .get(orderController.getOrder)
  .patch(restrictTo("admin", "seller"), orderController.updateOrder)
  .delete(restrictTo("admin"), orderController.deleteOrder);

router
  .route("/:id/status")
  .patch(restrictTo("seller", "admin"), orderController.updateOrderStatus);

router
  .route("/:id/payment")
  .patch(restrictTo("admin"), orderController.updatePaymentStatus);

module.exports = router;
