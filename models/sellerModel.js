const mongoose = require("mongoose");

const SellerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    storeName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    stripeAccountId: {
      type: String,
    },
    storeAddress: {
      type: String,
    },
    description: {
      type: String,
    },
    logo: {
      type: String,
    },
    bannerImage: {
      type: String,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    earnings: {
      type: Number,
      default: 0.0,
    },
  },
  { timestamps: true }
);

const SellerProfile = mongoose.model("SellerProfile", SellerProfileSchema);
module.exports = SellerProfile;
