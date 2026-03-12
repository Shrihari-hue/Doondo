const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    seeker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coverLetter: String,
    status: {
      type: String,
      enum: ["applied", "reviewing", "shortlisted", "rejected", "hired"],
      default: "applied",
    },
    employerNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    interview: {
      scheduledAt: Date,
      mode: {
        type: String,
        enum: ["phone", "video", "in-person"],
      },
      location: {
        type: String,
        trim: true,
        maxlength: 180,
      },
      meetingLink: {
        type: String,
        trim: true,
        maxlength: 300,
      },
      note: {
        type: String,
        trim: true,
        maxlength: 500,
      },
    },
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, seeker: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
