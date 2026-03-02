const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// 🧠 Create new user
exports.createUser = catchAsync(async (req, res, next) => {
  const user = await User.create(req.body);
  res.status(201).json({
    status: "success",
    data: { user },
  });
});

// 🔍 Get all users with query filters, search, sort & pagination
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const queryObj = { ...req.query };
  const excludedFields = ["page", "sort", "limit", "fields", "search"];
  excludedFields.forEach((el) => delete queryObj[el]);

  // 1️⃣ Basic Filtering (e.g., role=buyer&active=true)
  let query = User.find(queryObj);

  // 2️⃣ Search by name or email (case-insensitive)
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, "i");
    query = query.find({
      $or: [{ name: searchRegex }, { email: searchRegex }],
    });
  }

  // 3️⃣ Sorting (e.g., ?sort=createdAt or ?sort=-name)
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  // 4️⃣ Field Limiting (e.g., ?fields=name,email,role)
  if (req.query.fields) {
    const fields = req.query.fields.split(",").join(" ");
    query = query.select(fields);
  } else {
    query = query.select("-__v");
  }

  // 5️⃣ Pagination (e.g., ?page=2&limit=10)
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 20;
  const skip = (page - 1) * limit;
  query = query.skip(skip).limit(limit);

  const users = await query;
  const totalUsers = await User.countDocuments(queryObj);

  res.status(200).json({
    status: "success",
    results: users.length,
    total: totalUsers,
    page,
    data: { users },
  });
});

// 🔍 Get single user
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError("No user found with that ID", 404));
  res.status(200).json({ status: "success", data: { user } });
});

// ✏️ Update user
exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!user) return next(new AppError("No user found with that ID", 404));
  res.status(200).json({ status: "success", data: { user } });
});

// 🗑 Soft delete user
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, { active: false });
  if (!user) return next(new AppError("No user found with that ID", 404));
  res.status(204).json({ status: "success", data: null });
});

exports.banUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { active: false },
    { new: true }
  );

  if (!user) return next(new AppError("No user found with that ID", 404));

  res.status(200).json({
    status: "success",
    message: `User ${user.name} has been banned.`,
    data: { user },
  });
});

// ✅ Approve User (set active = true)
exports.approveUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { active: true },
    { new: true }
  );

  if (!user) return next(new AppError("No user found with that ID", 404));

  res.status(200).json({
    status: "success",
    message: `User ${user.name} has been approved.`,
    data: { user },
  });
});
