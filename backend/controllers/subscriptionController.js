const crypto = require("crypto");
const User = require("../models/User");
const razorpay = require("../config/razorpay");
const { SUBSCRIPTION_PLANS } = require("../utils/subscription");

const isRazorpayConfigured = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

  return (
    Boolean(keyId) &&
    Boolean(keySecret) &&
    keyId !== "test_key" &&
    keySecret !== "test_secret"
  );
};

const activatePlanForUser = async (userId, plan, paymentMeta = {}) =>
  User.findByIdAndUpdate(
    userId,
    {
      subscription: {
        plan: plan.id,
        status: "active",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        razorpayOrderId: paymentMeta.razorpayOrderId || "",
        razorpayPaymentId: paymentMeta.razorpayPaymentId || "",
        jobPostLimit: plan.jobPostLimit,
        priorityListing: plan.priorityListing,
      },
    },
    { new: true, select: "-password" }
  );

const getPlans = async (req, res) => {
  return res.json(Object.values(SUBSCRIPTION_PLANS));
};

const createOrder = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const plan = SUBSCRIPTION_PLANS[planId];

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    if (!isRazorpayConfigured()) {
      const user = await activatePlanForUser(req.user._id, plan);

      return res.json({
        mock: true,
        plan,
        message: "Subscription activated in local development mode",
        subscription: user.subscription,
      });
    }

    const order = await razorpay.orders.create({
      amount: plan.amount * 100,
      currency: plan.currency,
      receipt: `receipt_${req.user._id}_${Date.now()}`,
      notes: {
        planId,
        userId: String(req.user._id),
      },
    });

    await User.findByIdAndUpdate(req.user._id, {
      "subscription.razorpayOrderId": order.id,
    });

    return res.json({
      order,
      plan,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    return next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { planId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const plan = SUBSCRIPTION_PLANS[planId];
    const user = await activatePlanForUser(req.user._id, plan, {
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });

    return res.json({
      message: "Subscription activated",
      subscription: user.subscription,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getPlans,
  createOrder,
  verifyPayment,
};
