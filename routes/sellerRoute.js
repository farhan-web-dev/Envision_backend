const express = require("express");
const { protect, restrictTo } = require("../controller/authController");
const sellerProfileController = require("../controller/sellerController");
const upload = require("../config/multer");

const router = express.Router();

router.get("/by-user/:userId", sellerProfileController.getSellerByUserId);
// ✅ Get seller profile by userId
router.get("/user/:id", sellerProfileController.getSellerProfileByUserId);

// ✅ All routes require authentication
// 📌 Seller profile routes
router
  .route("/:id")
  .get(sellerProfileController.getSellerProfile) // GET one profile
  .patch(
    restrictTo("admin", "seller"),
    protect,
    upload.fields([
      { name: "logo", maxCount: 1 },
      { name: "banner", maxCount: 1 },
    ]),
    sellerProfileController.updateSellerProfile
  )
  .delete(
    restrictTo("admin"),
    protect,
    sellerProfileController.deleteSellerProfile
  );
// Create seller profile (accept logo and banner files)
router.post(
  "/",
  // restrictTo("admin", "seller"),
  // protect,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  sellerProfileController.createSellerProfile
);
router
  .route("/by-user/:userId")
  .get(sellerProfileController.getSellerByUserId)
  .patch(
    restrictTo("admin", "seller"),
    protect,
    sellerProfileController.updateSellerProfile
  )
  .delete(
    restrictTo("admin"),
    protect,
    sellerProfileController.deleteSellerProfile
  );
// router.use(protect);

module.exports = router;
