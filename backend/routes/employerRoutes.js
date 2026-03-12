const express = require("express");
const { body } = require("express-validator");
const {
  getEmployerJobs,
  getEmployerApplicants,
  updateApplicantDetails,
  updateApplicantStatus,
  updateJob,
} = require("../controllers/employerController");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validation");

const router = express.Router();

router.use(protect, authorize("employer"));

router.get("/jobs", getEmployerJobs);
router.get("/applicants", getEmployerApplicants);
router.put(
  "/applicants/:id/details",
  [
    body("employerNote").optional().isLength({ max: 1000 }).withMessage("Employer note can be at most 1000 characters"),
    body("clearInterview").optional().isBoolean().withMessage("clearInterview must be true or false"),
    body("interview").optional().isObject().withMessage("Interview details must be an object"),
    body("interview.scheduledAt").optional().isISO8601().withMessage("Interview date must be valid"),
    body("interview.mode").optional().isIn(["phone", "video", "in-person"]).withMessage("Interview mode is invalid"),
    body("interview.location").optional().isLength({ max: 180 }).withMessage("Interview location is too long"),
    body("interview.meetingLink").optional().isURL().withMessage("Interview meeting link must be a valid URL"),
    body("interview.note").optional().isLength({ max: 500 }).withMessage("Interview note can be at most 500 characters"),
  ],
  validate,
  updateApplicantDetails
);
router.put(
  "/applicants/:id/status",
  [body("status").isIn(["reviewing", "shortlisted", "rejected", "hired"]).withMessage("Valid status is required")],
  validate,
  updateApplicantStatus
);
router.put("/jobs/:id", updateJob);

module.exports = router;
