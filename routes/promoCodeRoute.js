const express = require("express");
const router = express.Router();
const promoController = require("../controller/promoCodeController");
const { protect } = require("../controller/authController");

// All promo routes protected for admins (optional: add admin middleware)
router.use(protect);

// ✅ Create a new promo code
router.post("/", promoController.createPromoCode);

// ✅ Get all promo codes
router.get("/", promoController.getAllPromoCodes);

// ✅ Get single promo code
router
  .route("/:id")
  .get(promoController.getPromoCode)
  .patch(promoController.updatePromoCode);

// ✅ Validate promo code by code
router.post("/validate", promoController.validatePromoCode);

// ✅ Increment usage count
router.patch("/:id/increment", promoController.incrementUsage);

// ✅ Delete promo code
router.delete("/:id", promoController.deletePromoCode);

module.exports = router;
