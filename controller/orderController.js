const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Notification = require("../models/notificationModel");

// ✅ Get all orders (admin/seller view)
exports.getAllOrders = catchAsync(async (req, res, next) => {
  const filter = {};

  // Allow sellers to only see their own orders
  if (req.user.role === "seller") {
    filter.sellerId = req.user.id;
  }

  const orders = await Order.find(filter)
    .populate("buyerId", "name email")
    .populate("sellerId", "storeName")
    .populate("items.productId", "title images");

  res.status(200).json({
    status: "success",
    results: orders.length,
    data: { orders },
  });
});

// ✅ Get a single order
exports.getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("buyerId", "name email")
    .populate("sellerId", "storeName")
    .populate("items.productId", "title images");

  if (!order) return next(new AppError("No order found with that ID", 404));

  res.status(200).json({
    status: "success",
    data: { order },
  });
});

// ✅ Create a new order
exports.createOrder = catchAsync(async (req, res, next) => {
  const { sellerId, items, shippingAddress } = req.body;

  if (!items || items.length === 0) {
    return next(new AppError("Order must contain at least one item", 400));
  }

  // Calculate total
  let totalAmount = 0;
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      return next(new AppError(`Product not found: ${item.productId}`, 404));
    }
    totalAmount += product.price * item.quantity;
    item.price = product.price;
    item.url = product.videos[0].url;
  }

  const order = await Order.create({
    buyerId: req.user.id,
    sellerId,
    items,
    totalAmount,
    shippingAddress,
  });

  // Create notification for seller
  try {
    await Notification.create({
      userId: sellerId,
      type: "order_update",
      message: `You have received a new order from ${
        req.user.name || "a buyer"
      }.`,
    });
  } catch (err) {
    console.error("Failed to create notification for seller:", err);
  }

  res.status(201).json({
    status: "success",
    data: { order },
  });
});

// Update order
exports.updateOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!order) {
    return next(new AppError("No order found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { order },
  });
});

// ✅ Update order status (seller/admin)
exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!order) {
    return next(new AppError("No order found with that ID", 404));
  }

  // Create notification for buyer
  try {
    await Notification.create({
      userId: order.buyerId,
      type: "order_update",
      message: `Your order status has been  "${order.status}".`,
    });
  } catch (err) {
    console.error("Failed to create notification for buyer:", err);
  }

  res.status(200).json({
    status: "success",
    data: { order },
  });
});

// ✅ Update payment status (admin/payment gateway)
exports.updatePaymentStatus = catchAsync(async (req, res, next) => {
  const { paymentStatus } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError("No order found with that ID", 404));

  order.paymentStatus = paymentStatus;
  await order.save();

  res.status(200).json({
    status: "success",
    data: { order },
  });
});

// ✅ Delete (admin only)
exports.deleteOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findByIdAndDelete(req.params.id);

  if (!order) return next(new AppError("No order found with that ID", 404));

  res.status(204).json({
    status: "success",
    data: null,
  });
});
