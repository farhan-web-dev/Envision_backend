const Product = require("../models/productModel");
const Order = require("../models/orderModel"); // To check order counts
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Review = require("../models/reveiwModel");

// ✅ Get all products (with filtering, sorting, and population)
exports.getAllProducts = catchAsync(async (req, res, next) => {
  // 1️⃣ Clone query object
  const queryObj = { ...req.query };
  const excludedFields = ["page", "sort", "limit", "fields"];
  excludedFields.forEach((el) => delete queryObj[el]);

  // 2️⃣ Convert bracketed keys manually: price[gte] → { price: { $gte: 10 } }
  const mongoQuery = {};

  Object.keys(queryObj).forEach((key) => {
    const match = key.match(/^(\w+)\[(gte|gt|lte|lt)\]$/);
    if (match) {
      const field = match[1];
      const operator = `$${match[2]}`;
      const value = queryObj[key];

      if (!mongoQuery[field]) mongoQuery[field] = {};
      mongoQuery[field][operator] = isNaN(value) ? value : Number(value);
    } else {
      // Normal (non-nested) query key
      mongoQuery[key] = queryObj[key];
    }
  });

  // console.log("✅ Final query:", mongoQuery);

  // 3️⃣ Build query
  // If categoryId is provided, include products whose categoryId equals it
  // or whose category has parentCategoryId equal to it.
  if (mongoQuery.categoryId) {
    const Category = require("../models/categoryModel");
    const catId = mongoQuery.categoryId;
    // Find child categories where parentCategoryId == catId
    const childCats = await Category.find({ parentCategoryId: catId }).select(
      "_id"
    );
    const childIds = childCats.map((c) => c._id);
    // Replace categoryId filter with $in [catId, ...childIds]
    mongoQuery.categoryId = { $in: [catId, ...childIds] };
  }

  let query = Product.find(mongoQuery)
    .populate("sellerId", "name")
    .populate("categoryId", "name");

  // 4️⃣ Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  // 5️⃣ Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  query = query.skip(skip).limit(limit);

  // 6️⃣ Execute query
  const products = await query;

  res.status(200).json({
    status: "success",
    results: products.length,
    data: { products },
  });
});

exports.getSellerProducts = catchAsync(async (req, res, next) => {
  // Ensure user is authenticated and has seller role
  if (!req.user || req.user.role !== "seller") {
    return next(new AppError("Unauthorized: Seller access only", 403));
  }

  const sellerId = req.user.id;

  // Find all products belonging to this seller
  const products = await Product.find({ sellerId })
    .populate("categoryId", "name") // populate category name
    .sort({ createdAt: -1 }); // newest first

  if (!products || products.length === 0) {
    return res.status(200).json({
      status: "success",
      results: 0,
      message: "No products found for this seller.",
      data: [],
    });
  }

  res.status(200).json({
    status: "success",
    results: products.length,
    data: products,
  });
});

exports.getSellerProductsbyId = catchAsync(async (req, res, next) => {
  const sellerId = req.params.sellerId;

  // Find all products belonging to this seller
  const products = await Product.find({ sellerId })
    .populate("categoryId", "name") // populate category name
    .sort({ createdAt: -1 }); // newest first

  if (!products || products.length === 0) {
    return res.status(200).json({
      status: "success",
      results: 0,
      message: "No products found for this seller.",
      data: [],
    });
  }

  res.status(200).json({
    status: "success",
    results: products.length,
    data: products,
  });
});

// ✅ Get single product by ID
exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate("sellerId")
    .populate("categoryId");

  if (!product) {
    return next(new AppError("No product found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { product },
  });
});

// ✅ Create new product
exports.createProduct = catchAsync(async (req, res, next) => {
  if (req.files && req.files.length > 0) {
    req.body.images = req.files.map((file) => file.path);
  }

  const newProduct = await Product.create(req.body);

  res.status(201).json({
    status: "success",
    data: { product: newProduct },
  });
});

// ✅ Update product
exports.updateProduct = catchAsync(async (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return next(new AppError("No data provided for update", 400));
  }

  if (req.files && req.files.length > 0) {
    req.body.images = req.files.map((file) => file.path);
  }

  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return next(new AppError("No product found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { product },
  });
});

// ✅ Delete product
exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return next(new AppError("No product found with that ID", 404));

  res.status(204).json({ status: "success", data: null });
});

const getTopRatedProductIds = async () => {
  const ratings = await Review.aggregate([
    {
      $group: {
        _id: "$productId",
        avgRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
    { $sort: { avgRating: -1, totalReviews: -1 } },
    { $limit: 20 }, // top 20 products by rating
  ]);
  return ratings.map((r) => r._id);
};

// ⭐ 1. Trending Products (high orders + high ratings)
exports.getTrendingProducts = catchAsync(async (req, res, next) => {
  // Step 1: Get top ordered products
  const topOrders = await Order.aggregate([
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        totalOrders: { $sum: "$items.quantity" },
      },
    },
    { $sort: { totalOrders: -1 } },
    { $limit: 20 },
  ]);

  const topOrderIds = topOrders.map((o) => o._id);

  // Step 2: Get top-rated products
  const topRatedIds = await getTopRatedProductIds();

  // Step 3: Combine both sets → trending = intersection
  const trendingIds = topRatedIds.filter((id) =>
    topOrderIds.some((o) => o.equals(id))
  );

  // Step 4: Fetch product details
  const products = await Product.find({ _id: { $in: trendingIds } })
    .populate("categoryId", "name")
    .populate("sellerId", "name")
    .limit(8);

  res.status(200).json({
    status: "success",
    results: products.length,
    data: { products },
  });
});

// 🌟 2. Featured Products (based on rating + admin flag)
exports.getFeaturedProducts = catchAsync(async (req, res, next) => {
  // Find top-rated or isFeatured products
  const topRatedIds = await getTopRatedProductIds();

  const products = await Product.find({
    $or: [
      { _id: { $in: topRatedIds.slice(0, 10) } },
      { isFeatured: true }, // optional field if you add it
    ],
  })
    .populate("categoryId", "name")
    .populate("sellerId", "name")
    .sort("-createdAt")
    .limit(8);

  res.status(200).json({
    status: "success",
    results: products.length,
    data: { products },
  });
});

// 🆕 3. Latest Products (new arrivals)
exports.getLatestProducts = catchAsync(async (req, res, next) => {
  const products = await Product.find()
    .sort("-createdAt")
    .limit(10)
    .populate("categoryId", "name")
    .populate("sellerId", "name");

  res.status(200).json({
    status: "success",
    results: products.length,
    data: { products },
  });
});

// ✅ Get products by categoryId (req.params.id)
exports.getProductsByCategoryId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const products = await require("../models/productModel").find({
      $or: [{ categoryId: id }, { parentCategoryId: id }],
    });
    res.status(200).json({
      status: "success",
      results: products.length,
      data: { products },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ✅ Search products by name in title or description
exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      return res
        .status(400)
        .json({ status: "fail", message: "Search query is required" });
    }
    const regex = new RegExp(q, "i"); // case-insensitive
    const products = await require("../models/productModel").find({
      $or: [{ title: regex }, { description: regex }],
    });
    res.status(200).json({
      status: "success",
      results: products.length,
      data: { products },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
