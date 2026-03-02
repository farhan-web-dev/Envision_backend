const Category = require("../models/categoryModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// ✅ Get all categories (with optional parent filtering)
exports.getAllCategories = catchAsync(async (req, res, next) => {
  const filter = {};
  if (req.query.parentCategoryId) {
    filter.parentCategoryId = req.query.parentCategoryId;
  }

  const categories = await Category.find(filter).populate(
    "parentCategoryId",
    "name"
  );

  res.status(200).json({
    status: "success",
    results: categories.length,
    data: { categories },
  });
});

// ✅ Get single category
exports.getCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id).populate(
    "parentCategoryId",
    "name"
  );

  if (!category) {
    return next(new AppError("No category found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { category },
  });
});

// ✅ Create category
exports.createCategory = catchAsync(async (req, res, next) => {
  const newCategory = await Category.create(req.body);

  res.status(201).json({
    status: "success",
    data: { category: newCategory },
  });
});

// ✅ Update category
exports.updateCategory = catchAsync(async (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return next(new AppError("No data provided for update", 400));
  }

  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    return next(new AppError("No category found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { category },
  });
});

// ✅ Delete category
exports.deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id);

  if (!category) {
    return next(new AppError("No category found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
