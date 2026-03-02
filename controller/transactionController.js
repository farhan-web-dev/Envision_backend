const Transaction = require("../models/transactionModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// ✅ Create a new transaction
exports.createTransaction = catchAsync(async (req, res, next) => {
  const newTransaction = await Transaction.create(req.body);

  res.status(201).json({
    status: "success",
    data: { transaction: newTransaction },
  });
});

// ✅ Get all transactions (admin or user view)
exports.getAllTransactions = catchAsync(async (req, res, next) => {
  let filter = {};

  // If user is logged in and not admin → show only their transactions
  if (req.user && req.user.role !== "admin") {
    filter.userId = req.user._id;
  }

  const transactions = await Transaction.find(filter)
    .populate("orderId", "totalAmount orderStatus")
    .populate("userId", "name email");

  res.status(200).json({
    status: "success",
    results: transactions.length,
    data: { transactions },
  });
});

// ✅ Get a single transaction by ID
exports.getTransaction = catchAsync(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id)
    .populate("orderId", "totalAmount orderStatus")
    .populate("userId", "name email");

  if (!transaction) {
    return next(new AppError("No transaction found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { transaction },
  });
});

// ✅ Update transaction status (admin or system)
exports.updateTransaction = catchAsync(async (req, res, next) => {
  const allowedFields = ["status", "transactionReference"];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const transaction = await Transaction.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!transaction) {
    return next(new AppError("No transaction found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { transaction },
  });
});

// ✅ Delete transaction (optional, admin only)
exports.deleteTransaction = catchAsync(async (req, res, next) => {
  const transaction = await Transaction.findByIdAndDelete(req.params.id);

  if (!transaction) {
    return next(new AppError("No transaction found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
