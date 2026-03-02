const express = require("express");
const categoryController = require("../controller/categoryController");
const { protect, restrictTo } = require("../controller/authController");

const router = express.Router();

router.route("/").get(categoryController.getAllCategories);
// ✅ Protect all routes
router.use(protect);

router.route("/").post(restrictTo("admin"), categoryController.createCategory);

router
  .route("/:id")
  .get(categoryController.getCategory)
  .patch(restrictTo("admin"), categoryController.updateCategory)
  .delete(restrictTo("admin"), categoryController.deleteCategory);

module.exports = router;
