const express = require("express");
const productController = require("../controller/productController");
const { protect, restrictTo } = require("../controller/authController");
const upload = require("../config/multer");

const router = express.Router();

router.get("/search", productController.searchProducts);
// 🚀 Product analytics
router.get("/trending", productController.getTrendingProducts);
router.get("/featured", productController.getFeaturedProducts);
router.get("/latest", productController.getLatestProducts);
router.route("/").get(productController.getAllProducts);

router.get(
  "/my-products",
  protect,
  restrictTo("seller", "admin"),
  productController.getSellerProducts
);

router.route("/:id").get(productController.getProduct);
router.route("/seller/:sellerId").get(productController.getSellerProductsbyId);
// ✅ Get products by categoryId (public)
router.get("/category/:id", productController.getProductsByCategoryId);

// ✅ Require authentication for all routes
router.use(protect);

router.route("/").post(
  restrictTo("seller", "admin"), // Only sellers/admins can create
  upload.array("images", 5), // Accept up to 5 images
  productController.createProduct
);

router
  .route("/:id")
  .patch(
    restrictTo("seller", "admin"),
    upload.array("images", 5),
    productController.updateProduct
  )
  .delete(restrictTo("admin", "seller"), productController.deleteProduct);

module.exports = router;
