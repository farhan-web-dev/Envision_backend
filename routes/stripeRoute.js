const express = require("express");
const router = express.Router();
const {
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus,
  getOrderDetails,
  getUserOrders,
  handleStripeWebhook,
  getUserCourses,
} = require("../controller/stripeController");
const { optionalProtect } = require("../controller/authController");

// ✅ Auth middleware
router.use(optionalProtect);

// ✅ Specific user route first
router.get("/user-courses", getUserCourses);

// ✅ Payment routes
router.post("/create-intent", createPaymentIntent);
router.post("/confirm", confirmPayment);
router.get("/status/:paymentIntentId", getPaymentStatus);

// ✅ Order routes
router.get("/orders", getUserOrders); // list all orders for user
router.get("/orders/:orderId", getOrderDetails); // single order by id

// ✅ Stripe webhook (no auth)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

module.exports = router;
