const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");

const globalErrorHandler = require("./controller/errorController");

const AppError = require("./utils/appError");

const userRouter = require("./routes/userRoute");
const sellerRouter = require("./routes/sellerRoute");
const productRouter = require("./routes/productRoute");
const categoryRouter = require("./routes/categoryRoute");
const cartRouter = require("./routes/cartRoute");
const orderRouter = require("./routes/orderRoute");
const transactionRouter = require("./routes/transactionRoute");
const conversationRouter = require("./routes/conversationRoute");
const notificationRouter = require("./routes/notificationRoute");
const promoCodeRouter = require("./routes/promoCodeRoute");
const analyticsRouter = require("./routes/analyticsRoute");
const authRouter = require("./routes/authRoute");
const reviewRouter = require("./routes/reveiwRoute");
const favouriteRouter = require("./routes/favouriteRoute");
const paymentRouter = require("./routes/stripeRoute");
const muxRouter = require("./routes/muxRoute");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:8080",
      "http://3.9.169.85:8080",
      "http://3.8.121.196:3000",
      "http://34.224.66.215",
    ],
    credentials: true,
  }),
);
// Set Security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(cookieParser());
// Limit requests from same API
const limiter = rateLimit({
  max: 1000000,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP , please try again in an hour",
});
app.use("/api", limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10mb" }));

// Data sanitizatiion against No SQL query injection
// app.use(mongoSanitize());

// Data sanitization against XSS
// app.use(xss());

// Prevent parameter polluution
// white list updated later
// app.use(hpp());

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/sellers", sellerRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/transactions", transactionRouter);
app.use("/api/v1/conversations", conversationRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/promocodes", promoCodeRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/favourites", favouriteRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/mux", muxRouter);

// Catch all undefined routes
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
