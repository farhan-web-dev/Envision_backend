const express = require("express");
const cartController = require("../controller/cartController");
const { protect } = require("../controller/authController");

const router = express.Router();

router.use(protect);
// 🛡️ All cart routes are protected (must be logged in)

router
  .route("/")
  .get(cartController.getMyCart) // GET /api/v1/cart
  .post(cartController.addToCart); // POST /api/v1/cart

router.route("/item").patch(cartController.updateCartItem); // PATCH /api/v1/cart/item

router.route("/item/:productId").delete(cartController.removeCartItem); // DELETE /api/v1/cart/item/:productId

router.delete("/clear", cartController.clearCart); // DELETE /api/v1/cart/clear

module.exports = router;
