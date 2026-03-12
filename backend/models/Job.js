const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    salary: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: "INR",
      },
    },
    workingHours: {
      type: String,
      required: true,
    },
    jobType: {
      type: String,
      enum: ["part-time", "full-time"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    workersNeeded: {
      type: Number,
      default: 1,
    },
    location: {
      city: {
        type: String,
        required: true,
      },
      area: String,
      address: String,
      coordinates: {
        type: pointSchema,
        required: true,
      },
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    priorityListing: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

jobSchema.index({ "location.coordinates": "2dsphere" });

module.exports = mongoose.model("Job", jobSchema);
