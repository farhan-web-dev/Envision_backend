const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: [true, "Order must belong to a buyer"],
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Order must belong to a seller"],
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product ID is required"],
        },
        title: String,
        price: Number,
        quantity: Number,
        image: String,
        // type: String,
        // videos: [String],
      },
    ],
    shippingAddress: {
      fullName: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      phone: String,
    },
    subtotal: Number,
    shipping: Number,
    total: Number,
    currency: String,
    paymentIntentId: String,
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// ✅ Auto-calculate totalAmount before saving
orderSchema.pre("save", function (next) {
  if (this.items && this.items.length > 0) {
    this.totalAmount = this.items.reduce((acc, item) => {
      return acc + item.price * item.quantity;
    }, 0);
  } else {
    this.totalAmount = 0;
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
