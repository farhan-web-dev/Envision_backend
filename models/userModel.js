const { default: mongoose } = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },
    phone: {
      type: String,
      validate: {
        validator: function (v) {
          // E.164 format (+923001234567)
          return /^\+[1-9]\d{1,14}$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid phone number! Use format like +923001234567`,
      },
    },
    role: {
      type: String,
      enum: ["buyer", "seller", "admin"],
      required: [true, "Role is required"],
      default: "buyer",
    },
    address: String,
    profileImage: String,
    isSeller: Boolean,
    active: {
      type: Boolean,
      default: true,
      // select: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    purchasedAt: { type: Date, default: Date.now },
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();

  if (!this.isNew && this.isModified("password")) {
    this.passwordChangedAt = Date.now() - 1000; // Ensure token is created after password has been changed
  }
});

// Auto-filter inactive users from queries
// userSchema.pre(/^find/, function (next) {
//   this.find({ active: { $ne: false } });
//   next();
// });

// Compare input password with hashed password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Check if password changed after token was issued
userSchema.methods.ChangedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimeStamp < changedTimeStamp;
  }

  return false;
};

// Generate and hash password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
