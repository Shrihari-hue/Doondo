const express = require("express");
const { body } = require("express-validator");
const {
  listJobs,
  getJobById,
  createJob,
  applyToJob,
  toggleBookmark,
  getSavedJobs,
} = require("../controllers/jobController");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validation");

const router = express.Router();

router.get("/", listJobs);
router.get("/saved/me", protect, authorize("seeker"), getSavedJobs);
router.get("/:id", getJobById);
router.post(
  "/",
  protect,
  authorize("employer"),
  [
    body("title").notEmpty().withMessage("Job title is required"),
    body("workingHours").notEmpty().withMessage("Working hours are required"),
    body("jobType").isIn(["part-time", "full-time"]).withMessage("Valid job type is required"),
    body("description").notEmpty().withMessage("Job description is required"),
    body("location.city").notEmpty().withMessage("City is required"),
    body("location.coordinates.coordinates")
      .isArray({ min: 2, max: 2 })
      .withMessage("Coordinates are required"),
  ],
  validate,
  createJob
);
router.post(
  "/apply",
  protect,
  authorize("seeker"),
  [body("jobId").notEmpty().withMessage("jobId is required")],
  validate,
  applyToJob
);
router.post("/:id/apply", protect, authorize("seeker"), applyToJob);
router.post("/:id/bookmark", protect, authorize("seeker"), toggleBookmark);

module.exports = router;
