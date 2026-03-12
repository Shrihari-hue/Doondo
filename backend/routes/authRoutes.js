const express = require("express");
const { body } = require("express-validator");
const {
  register,
  login,
  getProfile,
  updateProfile,
  uploadProfileAssets,
  deleteProfileAsset,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validation");
const upload = require("../middleware/upload");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").trim().isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("role").isIn(["seeker", "employer"]).withMessage("Valid role is required"),
    body("phone")
      .optional({ values: "falsy" })
      .matches(/^\+?[0-9\s-]{10,15}$/)
      .withMessage("Enter a valid phone number"),
    body("location.city").trim().notEmpty().withMessage("City is required"),
    body("location.area").trim().notEmpty().withMessage("Area is required"),
    body("location.pincode")
      .trim()
      .matches(/^\d{6}$/)
      .withMessage("Pincode must be a valid 6 digit number"),
    body("seekerProfile.preferredJobType")
      .optional()
      .isIn(["part-time", "full-time", "both"])
      .withMessage("Preferred job type is invalid"),
    body("employerProfile.businessName")
      .if(body("role").equals("employer"))
      .trim()
      .notEmpty()
      .withMessage("Business name is required"),
    body("employerProfile.businessType")
      .if(body("role").equals("employer"))
      .trim()
      .notEmpty()
      .withMessage("Business type is required"),
    body("employerProfile.contactNumber")
      .if(body("role").equals("employer"))
      .matches(/^\+?[0-9\s-]{10,15}$/)
      .withMessage("Business contact number is required"),
  ],
  validate,
  register
);

router.post(
  "/login",
  [
    body("email").trim().isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  login
);

router.get("/profile", protect, getProfile);
router.put(
  "/profile",
  protect,
  [
    body("name").optional().trim().notEmpty().withMessage("Name is required"),
    body("phone")
      .optional()
      .matches(/^\+?[0-9\s-]{10,15}$/)
      .withMessage("Enter a valid phone number"),
    body("location.city")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("City is required"),
    body("location.area")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Area is required"),
    body("location.pincode")
      .optional()
      .trim()
      .matches(/^\d{6}$/)
      .withMessage("Pincode must be a valid 6 digit number"),
    body("seekerProfile.preferredJobType")
      .optional()
      .isIn(["part-time", "full-time", "both"])
      .withMessage("Preferred job type is invalid"),
    body("employerProfile.businessName")
      .if((value, { req }) => req.user?.role === "employer" && req.body.employerProfile !== undefined)
      .trim()
      .notEmpty()
      .withMessage("Business name is required"),
    body("employerProfile.businessType")
      .if((value, { req }) => req.user?.role === "employer" && req.body.employerProfile !== undefined)
      .trim()
      .notEmpty()
      .withMessage("Business type is required"),
    body("employerProfile.contactNumber")
      .if((value, { req }) => req.user?.role === "employer" && req.body.employerProfile !== undefined)
      .matches(/^\+?[0-9\s-]{10,15}$/)
      .withMessage("Business contact number is required"),
  ],
  validate,
  updateProfile
);
router.post(
  "/profile/assets",
  protect,
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "resume", maxCount: 1 },
  ]),
  uploadProfileAssets
);
router.delete("/profile/assets/:assetType", protect, deleteProfileAsset);

module.exports = router;
