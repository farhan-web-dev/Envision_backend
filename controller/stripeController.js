const stripe = require("../config/stripe");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const SellerProfile = require("../models/sellerModel");
const Notification = require("../models/notificationModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const mongoose = require("mongoose");

// Create Payment Intent
const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency, items, shippingAddress } = req.body;

    // ✅ Detect guest
    const buyerId = req.user ? req.user.id : null;
    const buyerName = req.user ? req.user.name : shippingAddress.fullName;
    const buyerEmail = req.user ? req.user.email : shippingAddress.email;

    if (!amount || !currency || !items || !shippingAddress) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: amount, currency, items, shippingAddress",
      });
    }

    const validatedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.id} not found`,
        });
      }

      if (product.stock < item.quantity && product.type !== "course") {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${product.title}`,
        });
      }

      validatedItems.push({
        productId: product._id,
        title: product.title,
        price: product.price,
        quantity: item.quantity,
        // type: item.type || "physical",
        // videos: item.videos || [],
        image: product.images[0] || "",
      });

      subtotal += product.price * item.quantity;
    }

    const shipping = subtotal > 100 ? 0 : items.length > 0 ? 10 : 0;
    const total = subtotal + shipping;

    const sellerId = (await Product.findById(items[0].id)).sellerId;
    console.log("Seller ID:", sellerId);
    const sellerProfile = await SellerProfile.findOne({
      userId: new mongoose.Types.ObjectId(sellerId),
    });

    console.log("Seller Profile:", sellerProfile);

    if (!sellerProfile || !sellerProfile.stripeAccountId) {
      return res.status(400).json({
        success: false,
        message: "Seller does not have a Stripe Connect account.",
      });
    }

    // Platform fee (optional) example 10% fee
    const platformFee = Math.round(total * 0.1 * 100); // 10% fee in cents

    // Create payment intent to pay seller
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // total in cents
      currency: currency.toLowerCase(),
      metadata: {
        buyerId: buyerId ? String(buyerId) : "guest",
        sellerId: String(sellerId),
        items: JSON.stringify(validatedItems),
        shippingAddress: JSON.stringify(shippingAddress),
      },

      // 🔥 THE IMPORTANT PART
      transfer_data: {
        destination: sellerProfile.stripeAccountId, // send payment to seller
      },

      // 🔥 Platform fee (optional)
      application_fee_amount: platformFee,

      automatic_payment_methods: { enabled: true },
    });

    // ✅ Create Order (with or without buyerId)
    const order = await Order.create({
      buyerId: buyerId || null,
      sellerId,
      items: validatedItems,
      shippingAddress,
      paymentIntentId: paymentIntent.id,
      paymentStatus: "pending",
      orderStatus: "pending",
      subtotal,
      shipping,
      total,
      currency: currency.toLowerCase(),
      guestEmail: buyerEmail,
    });

    // ✅ Notification only if user exists
    if (sellerId) {
      try {
        await Notification.create({
          userId: sellerId,
          type: "order_update",
          message: `You have received a new order from ${buyerName}.`,
        });
      } catch (err) {
        console.error("Failed to create notification:", err);
      }
    }

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderId: order._id,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment intent",
      error: error.message,
    });
  }
};

// Confirm Payment
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const buyerId = req.user ? req.user.id : null;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "Payment intent ID is required",
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      return res.status(404).json({
        success: false,
        message: "Payment intent not found",
      });
    }

    let order = await Order.findOne({
      paymentIntentId: paymentIntentId.trim(),
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (paymentIntent.status === "succeeded") {
      order.paymentStatus = "paid";
      order.orderStatus = "processing";

      // Update stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity },
        });
      }

      await order.save();

      res.status(200).json({
        success: true,
        paymentIntentId: paymentIntent.id,
        orderId: order._id,
        message: "Payment confirmed successfully",
      });
    } else {
      order.paymentStatus = "failed";
      await order.save();
      res.status(400).json({
        success: false,
        message: "Payment failed",
      });
    }
  } catch (error) {
    console.error("Error confirming payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm payment",
      error: error.message,
    });
  }
};

// Get Payment Status
const getPaymentStatus = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const userId = req.user.id;

    // Find the order
    const order = await Order.findOne({
      paymentIntentId: paymentIntentId,
      user: userId,
    }).populate("items.product");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Retrieve payment intent from Stripe for latest status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.status(200).json({
      success: true,
      paymentStatus: paymentIntent.status,
      orderStatus: order.orderStatus,
      orderId: order._id,
    });
  } catch (error) {
    console.error("Error getting payment status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get payment status",
      error: error.message,
    });
  }
};

// Get Order Details
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    // const userId = req.user.id;

    const order = await Order.findOne({
      paymentIntentId: orderId.trim(),
    }).populate("items");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.orderStatus,
        total: order.total,
        items: order.items,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt,
        paymentStatus: order.paymentStatus,
        trackingNumber: order.trackingNumber,
      },
    });
  } catch (error) {
    console.error("Error getting order details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get order details",
      error: error.message,
    });
  }
};

// Get User Orders
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const orders = await Order.find({ buyerId: userId })
      .populate("items")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments({ buyerId: userId });

    res.status(200).json({
      success: true,
      orders: orders.map((order) => ({
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.orderStatus,
        total: order.total,
        items: order.items,
        createdAt: order.createdAt,
        paymentStatus: order.paymentStatus,
      })),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Error getting user orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get orders",
      error: error.message,
    });
  }
};

const getUserCourses = async (req, res) => {
  try {
    const userId = req.user.id;

    // ✅ 1. Get all orders for this user
    const orders = await Order.find({ buyerId: userId }).select("items");

    if (!orders.length) {
      return res.status(200).json({
        success: true,
        courses: [],
        message: "No orders found for this user",
      });
    }

    // ✅ 2. Extract all productIds from order items
    const productIds = orders.flatMap((order) =>
      order.items.map((item) => item.productId)
    );

    if (!productIds.length) {
      return res.status(200).json({
        success: true,
        courses: [],
        message: "No products found in orders",
      });
    }

    // ✅ 3. Find products with type = "course"
    const courses = await Product.find({
      _id: { $in: productIds },
      type: "course",
    }).select("title description price videos images");

    res.status(200).json({
      success: true,
      total: courses.length,
      courses,
    });
  } catch (error) {
    console.error("Error getting user courses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user courses",
      error: error.message,
    });
  }
};

// Stripe Webhook Handler
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        console.log("PaymentIntent succeeded:", paymentIntent.id);

        // Update order status
        await Order.findOneAndUpdate(
          { paymentIntentId: paymentIntent.id },
          {
            paymentStatus: "paid",
            orderStatus: "processing",
          }
        );
        break;

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object;
        console.log("PaymentIntent failed:", failedPayment.id);

        // Update order status
        await Order.findOneAndUpdate(
          { paymentIntentId: failedPayment.id },
          { paymentStatus: "failed" }
        );
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error handling webhook:", error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus,
  getOrderDetails,
  getUserOrders,
  handleStripeWebhook,
  getUserCourses,
};
