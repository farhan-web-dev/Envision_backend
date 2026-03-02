const PromoCode = require("../models/promoCodeModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// ✅ Create a new promo code
exports.createPromoCode = catchAsync(async (req, res, next) => {
  const promo = await PromoCode.create(req.body);

  res.status(201).json({
    status: "success",
    data: { promo },
  });
});

// ✅ Get all promo codes
exports.getAllPromoCodes = catchAsync(async (req, res, next) => {
  const promos = await PromoCode.find().sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: promos.length,
    data: { promos },
  });
});

// ✅ Get single promo code by ID
exports.getPromoCode = catchAsync(async (req, res, next) => {
  const promo = await PromoCode.findById(req.params.id);
  if (!promo) return next(new AppError("Promo code not found", 404));

  res.status(200).json({
    status: "success",
    data: { promo },
  });
});

// ✅ Validate promo code (check expiry and usage)
exports.validatePromoCode = catchAsync(async (req, res, next) => {
  const { code } = req.body;
  const promo = await PromoCode.findOne({ code: code.toUpperCase() });

  if (!promo) return next(new AppError("Invalid promo code", 404));
  if (promo.expiryDate < new Date())
    return next(new AppError("Promo code expired", 400));
  if (promo.usedCount >= promo.usageLimit)
    return next(new AppError("Promo code usage limit reached", 400));

  res.status(200).json({
    status: "success",
    data: { promo },
  });
});

// ✅ Increment usage count when applied successfully
exports.incrementUsage = catchAsync(async (req, res, next) => {
  const promo = await PromoCode.findByIdAndUpdate(
    req.params.id,
    { $inc: { usedCount: 1 } },
    { new: true }
  );

  if (!promo) return next(new AppError("Promo code not found", 404));

  res.status(200).json({
    status: "success",
    data: { promo },
  });
});

// ✅ Update promo code
exports.updatePromoCode = catchAsync(async (req, res, next) => {
  const promo = await PromoCode.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!promo) return next(new AppError("Promo code not found", 404));

  res.status(200).json({
    status: "success",
    data: { promo },
  });
});

// ✅ Delete promo code
exports.deletePromoCode = catchAsync(async (req, res, next) => {
  const promo = await PromoCode.findByIdAndDelete(req.params.id);
  if (!promo) return next(new AppError("Promo code not found", 404));

  res.status(204).json({
    status: "success",
    data: null,
  });
});
