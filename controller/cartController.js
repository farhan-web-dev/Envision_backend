const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// ✅ Get logged-in user's cart
exports.getMyCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ userId: req.user.id }).populate(
    "items.productId",
    "title price images"
  );

  if (!cart) {
    return next(new AppError("No cart found for this user", 404));
  }

  res.status(200).json({
    status: "success",
    data: { cart },
  });
});

// ✅ Add item to cart (or update quantity)
exports.addToCart = catchAsync(async (req, res, next) => {
  const { productId, quantity } = req.body;
  console.log(req.user.id, productId, quantity);

  if (!productId || !quantity) {
    return next(new AppError("Product ID and quantity are required", 400));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  // Find user's existing cart or create new one
  let cart = await Cart.findOne({ userId: req.user.id });

  if (!cart) {
    cart = await Cart.create({
      userId: req.user.id,
      items: [{ productId, quantity, price: product.price }],
    });
  } else {
    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex > -1) {
      // update existing item
      cart.items[itemIndex].quantity += quantity;
      cart.items[itemIndex].price = product.price;
    } else {
      // add new item
      cart.items.push({ productId, quantity, price: product.price });
    }

    cart.totalPrice = cart.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    await cart.save();
  }

  res.status(200).json({
    status: "success",
    data: { cart },
  });
});

// ✅ Update item quantity in cart
exports.updateCartItem = catchAsync(async (req, res, next) => {
  const { productId, quantity } = req.body;
  if (!productId || !quantity) {
    return next(new AppError("Product ID and quantity are required", 400));
  }

  const cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) {
    return next(new AppError("No cart found for this user", 404));
  }

  const item = cart.items.find((i) => i.productId.toString() === productId);
  if (!item) {
    return next(new AppError("Product not found in cart", 404));
  }

  item.quantity = quantity;
  cart.totalPrice = cart.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  await cart.save();

  res.status(200).json({
    status: "success",
    data: { cart },
  });
});

// ✅ Remove an item from cart
exports.removeCartItem = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) {
    return next(new AppError("No cart found for this user", 404));
  }

  cart.items = cart.items.filter(
    (item) => item.productId.toString() !== productId
  );

  cart.totalPrice = cart.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  await cart.save();

  res.status(200).json({
    status: "success",
    data: { cart },
  });
});

// ✅ Clear the entire cart
exports.clearCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOneAndUpdate(
    { userId: req.user.id },
    { items: [], totalPrice: 0 },
    { new: true }
  );

  res.status(200).json({
    status: "success",
    data: { cart },
  });
});
