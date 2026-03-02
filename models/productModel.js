const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  title: String,
  url: String, // hosted on Mux / Vimeo / Cloudflare Stream
  duration: Number,
  order: Number,
});

const ProductSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // or "User" if products link directly to users
      required: true,
    },
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    stock: {
      type: Number,
      required: [true, "Product stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    images: {
      type: [String], // array of URLs
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one product image is required",
      },
    },
    freeShipping: {
      type: Boolean,
      default: false,
    },
    condition: {
      type: String,
      enum: ["new", "used"],
      default: "new",
    },
    isAuction: {
      type: Boolean,
      default: false,
    },
    auctionEndDate: {
      type: Date,
      validate: {
        validator: function (value) {
          // Only validate if it's an auction product
          if (this.isAuction) return value instanceof Date;
          return true;
        },
        message: "Auction end date is required for auction products",
      },
    },
    type: {
      type: String,
      enum: ["physical", "course"],
      default: "physical",
    },
    // 🔹 Course-specific fields (only relevant if type === "course")
    instructor: {
      type: String,
      // required: function () {
      //   return this.type === "course";
      // },
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    duration: String, // e.g. "5 hours", "20 lectures"
    videos: [videoSchema], // list of hosted video metadata
    courseThumbnail: String,
    previewVideo: String,
    requirements: [String],
    whatYouWillLearn: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
