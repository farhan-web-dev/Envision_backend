const SellerProfile = require("../models/sellerModel");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const stripe = require("../config/stripe");
console.log("Stripe key in sellerController:", process.env.STRIPE_SECRET_KEY);

// ✅ Get all seller profiles
exports.getAllSellerProfiles = catchAsync(async (req, res, next) => {
  const queryObj = { ...req.query };
  const excludedFields = ["page", "sort", "limit", "fields"];
  excludedFields.forEach((el) => delete queryObj[el]);

  let query = SellerProfile.find(queryObj).populate({
    path: "userId",
    select: "name email role", // adjust fields based on your User model
  });

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  const profiles = await query;

  res.status(200).json({
    status: "success",
    results: profiles.length,
    data: {
      profiles,
    },
  });
});

// ✅ Get single seller profile by ID
exports.getSellerProfile = catchAsync(async (req, res, next) => {
  const profile = await SellerProfile.findOne({
    userId: req.params.id,
  }).populate("userId");

  if (!profile) {
    return next(new AppError("No seller profile found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      profile,
    },
  });
});

exports.createSellerProfile = catchAsync(async (req, res, next) => {
  console.log("Create Seller Profile Request Body:", req.body);

  let logoImage = null;
  let bannerImage = null;

  if (req.files) {
    if (req.files.logo?.[0]) logoImage = req.files.logo[0].path;
    if (req.files.banner?.[0]) bannerImage = req.files.banner[0].path;
  }

  // Check if profile already exists
  let existingProfile = await SellerProfile.findOne({
    userId: req.body.userId,
  });

  if (existingProfile) {
    return res.status(400).json({
      status: "fail",
      message: "Seller profile already exists",
      stripeAccountId: existingProfile.stripeAccountId,
    });
  }

  const user = await User.findById(req.body.userId);

  // Reuse Stripe account if user already has one
  let stripeAccountId = user.stripeAccountId;

  if (!stripeAccountId) {
    // Create new Stripe account
    const account = await stripe.accounts.create({
      type: "express",
      email: req.body.email || user.email,
    });

    stripeAccountId = account.id;

    // Save it on user (avoid duplicates)
    await User.findByIdAndUpdate(req.body.userId, {
      stripeAccountId: stripeAccountId,
    });
  }

  // Create onboarding link
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${process.env.CLIENT_URL}/seller/onboarding/refresh`,
    return_url: `${process.env.CLIENT_URL}`,
    type: "account_onboarding",
  });

  // Create seller profile
  const newProfile = await SellerProfile.create({
    ...req.body,
    logoImage,
    bannerImage,
    userId: req.body.userId,
    stripeAccountId: stripeAccountId,
  });

  // Update user role
  await User.findByIdAndUpdate(req.body.userId, {
    isSeller: true,
    role: "seller",
  });

  res.status(201).json({
    status: "success",
    data: {
      profile: newProfile,
      stripeOnboardingUrl: accountLink.url,
    },
  });
});

// ✅ Update seller profile by userId
exports.updateSellerProfile = catchAsync(async (req, res, next) => {
  console.log("Content-Type:", req.headers["content-type"]);
  console.log("Update Request Body:", req.body); // Debug log
  const updateData = { ...req.body };
  // multer.fields stores files in req.files as arrays per field
  if (req.files) {
    if (req.files.logo && req.files.logo[0]) {
      updateData.logoImage = req.files.logo[0].path;
    }
    if (req.files.banner && req.files.banner[0]) {
      updateData.bannerImage = req.files.banner[0].path;
    }
  }
  if (!updateData || Object.keys(updateData).length === 0) {
    return next(new AppError("No data provided for update", 400));
  }
  const profile = await SellerProfile.findOneAndUpdate(
    { _id: req.params.id },
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!profile) {
    return next(new AppError("No seller profile found for this userId", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      profile,
    },
  });
});

// ✅ Delete seller profile
exports.deleteSellerProfile = catchAsync(async (req, res, next) => {
  const profile = await SellerProfile.findByIdAndDelete(req.params.id);

  if (!profile) {
    return next(new AppError("No seller profile found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// ✅ Get seller profile by userId (req.params.id)
exports.getSellerProfileByUserId = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const profile = await SellerProfile.findOne({ userId: id }).populate(
    "userId",
    "name email role"
  );
  if (!profile) {
    return next(new AppError("No seller profile found for this user", 404));
  }
  res.status(200).json({
    status: "success",
    data: { profile },
  });
});

// ✅ Get seller profile by userId from req.params.userId
exports.getSellerByUserId = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const profile = await SellerProfile.findOne({ userId }).populate(
    "userId",
    "name email role"
  );
  if (!profile) {
    return next(new AppError("No seller profile found for this userId", 404));
  }
  res.status(200).json({
    status: "success",
    data: { profile },
  });
});
