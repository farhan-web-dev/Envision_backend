const mongoose = require("mongoose");

const favouriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
  },
  { timestamps: true }
);

// Prevent duplicate favourites for the same user and product
favouriteSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model("Favourite", favouriteSchema);
