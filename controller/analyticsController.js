const User = require("../models/userModel");
const SellerProfile = require("../models/sellerModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const Message = require("../models/converstionModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");

// 📊 Get full analytics summary
exports.getDashboardAnalytics = catchAsync(async (req, res, next) => {
  // 🧮 Total Users & Sellers
  const totalUsers = await User.countDocuments();
  const totalSellers = await SellerProfile.countDocuments();

  // 💰 Total Sales (sum of all paid orders)
  const totalSalesAgg = await Order.aggregate([
    { $match: { paymentStatus: "paid" } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);
  const totalSales = totalSalesAgg[0]?.total || 0;

  // 🕓 Pending Orders
  const pendingOrders = await Order.countDocuments({ orderStatus: "pending" });

  // ⚖️ Open Disputes (placeholder or from a future model)
  const openDisputes = 3; // Static for now

  // 💵 Average Order Value
  const avgOrderAgg = await Order.aggregate([
    { $match: { paymentStatus: "paid" } },
    { $group: { _id: null, avgValue: { $avg: "$totalAmount" } } },
  ]);
  const avgOrderValue = avgOrderAgg[0]?.avgValue?.toFixed(2) || 0;

  // 📈 Revenue Trends (monthly revenue & profit simulation)
  const revenueTrends = await Order.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) }, // this year
      },
    },
    {
      $group: {
        _id: { month: { $month: "$createdAt" } },
        revenue: { $sum: "$totalAmount" },
        profit: { $sum: { $multiply: ["$totalAmount", 0.2] } }, // simulate 20% profit
      },
    },
    { $sort: { "_id.month": 1 } },
  ]);

  // 📦 Order Volume (number of orders per month)
  const orderVolume = await Order.aggregate([
    {
      $group: {
        _id: { month: { $month: "$createdAt" } },
        orders: { $sum: 1 },
      },
    },
    { $sort: { "_id.month": 1 } },
  ]);

  // 👥 User Growth (new users by month)
  const userGrowth = await User.aggregate([
    {
      $group: {
        _id: { month: { $month: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.month": 1 } },
  ]);

  // 🏆 Top Selling Products
  const topProducts = await Order.aggregate([
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        salesCount: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.price" },
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $project: {
        _id: 0,
        productName: "$product.title",
        salesCount: 1,
        revenue: 1,
      },
    },
    { $sort: { salesCount: -1 } },
    { $limit: 5 },
  ]);

  // 🧾 Final JSON response
  res.status(200).json({
    status: "success",
    data: {
      kpis: {
        totalUsers,
        totalSellers,
        totalSales,
        pendingOrders,
        openDisputes,
        avgOrderValue,
      },
      charts: {
        revenueTrends,
        orderVolume,
        userGrowth,
        topProducts,
      },
    },
  });
});

exports.getOrderAnalytics = catchAsync(async (req, res, next) => {
  // Total Orders
  const totalOrders = await Order.countDocuments();

  // Pending Orders
  const pendingOrders = await Order.countDocuments({ orderStatus: "pending" });

  // Total Revenue (sum of all paid orders)
  const revenueAgg = await Order.aggregate([
    { $match: { paymentStatus: "paid" } },
    { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
  ]);

  const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

  // Avg Order Value (AOV)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  res.status(200).json({
    status: "success",
    data: {
      totalOrders,
      totalRevenue: totalRevenue.toFixed(2),
      avgOrderValue: avgOrderValue.toFixed(2),
      pendingOrders,
    },
  });
});

// ✅ Get Seller Dashboard Analytics
exports.getSellerDashboardAnalytics = async (req, res) => {
  try {
    // ✅ Convert sellerId to ObjectId for MongoDB match
    const sellerId = new mongoose.Types.ObjectId(req.user.id);

    // 1️⃣ Total Products
    const totalProducts = await Product.countDocuments({ sellerId });

    // 2️⃣ Orders by status
    const orders = await Order.aggregate([
      { $match: { sellerId, paymentStatus: "paid" } },
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const orderCounts = {
      pending: 0,
      shipped: 0,
      delivered: 0,
      total: 0,
    };
    orders.forEach((o) => {
      orderCounts[o._id] = o.count;
      orderCounts.total += o.count;
    });

    // 3️⃣ Monthly Earnings
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const monthlyEarnings = await Order.aggregate([
      {
        $match: {
          sellerId,
          paymentStatus: "paid",
          createdAt: { $gte: startOfMonth, $lt: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$total" },
        },
      },
    ]);

    const earnings =
      monthlyEarnings.length > 0 ? monthlyEarnings[0].totalEarnings : 0;

    // 4️⃣ Messages count (if implemented)
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);
    const newMessages = await Message.countDocuments({
      sellerId,
      createdAt: { $gte: lastMonth },
    }).catch(() => 0);

    // 5️⃣ Sales for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    const monthlySales = await Order.aggregate([
      {
        $match: {
          sellerId,
          paymentStatus: "paid",
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalSales: { $sum: "$total" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Format data for chart
    const labels = [];
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;

      const record = monthlySales.find(
        (m) => m._id.year === year && m._id.month === month
      );

      labels.push(d.toLocaleString("default", { month: "short" }));
      data.push(record ? record.totalSales : 0);
    }

    res.status(200).json({
      status: "success",
      data: {
        totalProducts,
        orders: orderCounts,
        monthlyEarnings: earnings,
        newMessages,
        salesOverview: { labels, data },
      },
    });
  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch seller analytics",
      error: err.message,
    });
  }
};
