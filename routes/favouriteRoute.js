const express = require("express");
const router = express.Router();
const favouriteController = require("../controller/favouriteController");
const { protect } = require("../controller/authController");

// ✅ All favourite routes are protected (must be logged in)

router.use(protect);
// Add a product to favourites
router.post("/", favouriteController.addToFavourites);

// Get all favourites for logged-in user
router.get("/", favouriteController.getMyFavourites);

// Remove one product from favourites
router.delete("/:productId", favouriteController.removeFromFavourites);

// Clear all favourites
router.delete("/", favouriteController.clearFavourites);

module.exports = router;
