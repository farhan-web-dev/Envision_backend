const Favourite = require("../models/favouriteModel");
const Product = require("../models/productModel");

// ✅ Add product to favourites
exports.addToFavourites = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Ensure product exists
    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if already favourited
    const existing = await Favourite.findOne({ userId, productId });
    if (existing) {
      return res.status(200).json({
        message: "Product already in favourites",
        data: existing,
      });
    }

    const favourite = await Favourite.create({ userId, productId });

    res.status(201).json({
      status: "success",
      message: "Product added to favourites",
      data: favourite,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ✅ Get all favourite products of a user
exports.getMyFavourites = async (req, res) => {
  try {
    const userId = req.user.id;

    const favourites = await Favourite.find({ userId })
      .populate({
        path: "productId",
        select: "title price images categoryId description",
        populate: { path: "categoryId", select: "name" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: favourites.length,
      data: favourites,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ✅ Remove a product from favourites
exports.removeFromFavourites = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const fav = await Favourite.findOneAndDelete({ userId, productId });

    if (!fav) {
      return res
        .status(404)
        .json({ message: "Product not found in favourites" });
    }

    res.status(200).json({
      status: "success",
      message: "Product removed from favourites",
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ✅ Clear all favourites for current user
exports.clearFavourites = async (req, res) => {
  try {
    const userId = req.user.id;
    await Favourite.deleteMany({ userId });

    res.status(200).json({
      status: "success",
      message: "All favourites cleared",
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
