const Notification = require("../models/notificationModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// ✅ Get all notifications for logged-in user
exports.getUserNotifications = catchAsync(async (req, res, next) => {
  const notifications = await Notification.find({
    userId: req.user._id,
    isRead: false,
  }).sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: notifications.length,
    data: { notifications },
  });
});

// ✅ Create a new notification
exports.createNotification = catchAsync(async (req, res, next) => {
  const { userId, type, message } = req.body;

  const notification = await Notification.create({
    userId,
    type,
    message,
  });

  res.status(201).json({
    status: "success",
    data: { notification },
  });
});

// ✅ Mark single notification as read
exports.markAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return next(new AppError("No notification found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { notification },
  });
});

// ✅ Mark all notifications as read for user
exports.markAllAsRead = catchAsync(async (req, res, next) => {
  await Notification.updateMany({ userId: req.user._id }, { isRead: true });

  res.status(200).json({
    status: "success",
    message: "All notifications marked as read",
  });
});

// ✅ Delete a notification
exports.deleteNotification = catchAsync(async (req, res, next) => {
  const notification = await Notification.findByIdAndDelete(req.params.id);

  if (!notification) {
    return next(new AppError("No notification found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
