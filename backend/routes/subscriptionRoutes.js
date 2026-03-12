const express = require("express");
const { body } = require("express-validator");
const {
  getPlans,
  createOrder,
  verifyPayment,
} = require("../controllers/subscriptionController");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validation");

const router = express.Router();

router.get("/plans", getPlans);
router.post(
  "/create-order",
  protect,
  authorize("employer"),
  [body("planId").isIn(["basic", "pro", "premium"]).withMessage("Valid plan is required")],
  validate,
  createOrder
);
router.post(
  "/verify",
  protect,
  authorize("employer"),
  [
    body("planId").isIn(["basic", "pro", "premium"]).withMessage("Valid plan is required"),
    body("razorpay_order_id").notEmpty(),
    body("razorpay_payment_id").notEmpty(),
    body("razorpay_signature").notEmpty(),
  ],
  validate,
  verifyPayment
);

module.exports = router;
