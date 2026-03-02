const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Transaction must be linked to an order"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Transaction must belong to a user"],
    },
    amount: {
      type: Number,
      required: [true, "Transaction amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    method: {
      type: String,
      enum: ["card", "paypal", "stripe", "applepay"],
      required: [true, "Payment method is required"],
    },
    status: {
      type: String,
      enum: ["success", "failed", "pending", "refunded"],
      default: "pending",
    },
    transactionReference: {
      type: String,
      required: [true, "Transaction reference is required"],
      unique: true,
    },
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;
