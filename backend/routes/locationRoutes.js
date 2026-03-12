const express = require("express");
const { body, param } = require("express-validator");
const {
  getPincodeDetails,
  validatePincode,
} = require("../controllers/locationController");
const validate = require("../middleware/validation");

const router = express.Router();

router.get(
  "/pincode/:pincode",
  [param("pincode").matches(/^\d{6}$/).withMessage("Pincode must be a valid 6 digit number")],
  validate,
  getPincodeDetails
);

router.post(
  "/validate-pincode",
  [
    body("pincode").matches(/^\d{6}$/).withMessage("Pincode must be a valid 6 digit number"),
    body("city").trim().notEmpty().withMessage("City is required"),
    body("area").trim().notEmpty().withMessage("Area is required"),
  ],
  validate,
  validatePincode
);

module.exports = router;
