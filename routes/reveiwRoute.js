const express = require("express");
const router = express.Router();
const reviewController = require("../controller/reveiwController");
const { protect } = require("../controller/authController");

router.get("/:productId/ratings", reviewController.getProductRatingStats);

// 🧩 All routes require authentication
// ✅ Get all reviews for a specific product (public)
router.get("/product/:productId", reviewController.getReveiwOfProduct);

router.use(protect);

// ✅ Create new review
router.post("/", reviewController.createReview);

// ✅ Get all reviews (optional filters: ?productId=...&userId=...)
router.get("/", reviewController.getAllReviews);

// ✅ Get single review
router.get("/:id", reviewController.getReview);

// ✅ Update review (user who created it)
router.patch("/:id", reviewController.updateReview);

// ✅ Delete review (user or admin)
router.delete("/:id", reviewController.deleteReview);

module.exports = router;
