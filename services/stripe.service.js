const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const createCustomer = async (user) => {
  return await stripe.customers.create({
    name: user.name,
    email: user.email,
  });
};

const createPaymentMethod = async (card) => {
  return await stripe.paymentMethods.create({
    type: "card",
    card: {
      number: card.number,
      exp_month: card.exp_month,
      exp_year: card.exp_year,
      cvc: card.cvc,
    },
  });
};

const attachPaymentMethodToCustomer = async (paymentMethodId, customerId) => {
  return await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });
};

const createPaymentIntent = async ({
  amount,
  currency,
  customerId,
  paymentMethodId,
}) => {
  return await stripe.paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    payment_method: paymentMethodId,
    confirm: true,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: "never", // 👈 Prevents Stripe from requiring return_url
    },
  });
};

module.exports = {
  createCustomer,
  createPaymentMethod,
  attachPaymentMethodToCustomer,
  createPaymentIntent,
};
