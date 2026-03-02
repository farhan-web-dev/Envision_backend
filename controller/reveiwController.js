const Review = require("../models/reveiwModel");
const Product = require("../models/productModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");

// 🧮 Helper: Recalculate average rating
const calcAverageRatings = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { productId } },
    {
      $group: {
        _id: "$productId",
        nRatings: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingsCount: stats[0].nRatings,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      ratingsCount: 0,
      ratingsAverage: 0,
    });
  }
};

// ✅ Create Review
exports.createReview = catchAsync(async (req, res, next) => {
  const { productId, rating, comment } = req.body;

  const review = await Review.create({
    productId,
    userId: req.user._id,
    rating,
    comment,
  });

  await calcAverageRatings(productId);

  res.status(201).json({
    status: "success",
    data: { review },
  });
});

// ✅ Get all reviews (with filters)
exports.getAllReviews = catchAsync(async (req, res, next) => {
  const filter = {};
  if (req.query.productId) filter.productId = req.query.productId;
  if (req.query.userId) filter.userId = req.query.userId;

  const reviews = await Review.find(filter).sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: reviews.length,
    data: { reviews },
  });
});

// ✅ Get single review
exports.getReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError("No review found", 404));

  res.status(200).json({
    status: "success",
    data: { review },
  });
});

// ✅ Update review (only owner)
exports.updateReview = catchAsync(async (req, res, next) => {
  const review = await Review.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!review)
    return next(new AppError("Review not found or not authorized", 404));

  await calcAverageRatings(review.productId);

  res.status(200).json({
    status: "success",
    data: { review },
  });
});

// ✅ Delete review (user or admin)
exports.deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findOneAndDelete({
    _id: req.params.id,
    $or: [{ userId: req.user._id }, { role: "admin" }],
  });

  if (!review)
    return next(new AppError("Review not found or not authorized", 404));

  await calcAverageRatings(review.productId);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getProductRatingStats = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  const stats = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$productId",
        avgRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length === 0)
    return next(new AppError("No ratings found for this product", 404));

  res.status(200).json({
    status: "success",
    data: {
      productId,
      averageRating: stats[0].avgRating.toFixed(2),
      totalReviews: stats[0].totalReviews,
    },
  });
});

// ✅ Get all reviews for a specific product by productId (public)
exports.getReveiwOfProduct = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const reviews = await Review.find({ productId }).sort("-createdAt");
  res.status(200).json({
    status: "success",
    results: reviews.length,
    data: { reviews },
  });
});
