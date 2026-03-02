// config/stripe.js
require("dotenv").config({ path: "./config.env" }); // ensure env is loaded first
const Stripe = require("stripe");

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Stripe secret key is not defined in environment variables");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = stripe;
