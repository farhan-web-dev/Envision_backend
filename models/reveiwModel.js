const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Review must belong to a product"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
    rating: {
      type: Number,
      required: [true, "Please provide a rating between 1 and 5"],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// ✅ One review per user per product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

// Auto populate user info
reviewSchema.pre(/^find/, function (next) {
  this.populate({ path: "userId", select: "name email profileImage" });
  next();
});

module.exports = mongoose.model("Review", reviewSchema);
