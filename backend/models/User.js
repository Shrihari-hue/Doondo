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
      default: [77.5946, 12.9716],
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["seeker", "employer"],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    phone: {
      type: String,
      trim: true,
    },
    profilePhoto: {
      url: String,
      originalName: String,
      mimeType: String,
      size: Number,
      uploadedAt: Date,
    },
    resume: {
      url: String,
      originalName: String,
      mimeType: String,
      size: Number,
      uploadedAt: Date,
    },
    location: {
      city: String,
      area: String,
      pincode: String,
      address: String,
      coordinates: {
        type: pointSchema,
        default: () => ({
          type: "Point",
          coordinates: [77.5946, 12.9716],
        }),
      },
    },
    seekerProfile: {
      skills: {
        type: [String],
        default: [],
      },
      preferredJobType: {
        type: String,
        enum: ["part-time", "full-time", "both"],
        default: "both",
      },
      bio: String,
    },
    employerProfile: {
      businessName: String,
      businessType: String,
      contactNumber: String,
      description: String,
    },
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
      },
    ],
    subscription: {
      plan: {
        type: String,
        enum: ["basic", "pro", "premium", "none"],
        default: "none",
      },
      status: {
        type: String,
        enum: ["active", "inactive", "expired"],
        default: "inactive",
      },
      currentPeriodEnd: Date,
      razorpayOrderId: String,
      razorpayPaymentId: String,
      jobPostLimit: {
        type: Number,
        default: 0,
      },
      priorityListing: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

userSchema.index({ "location.coordinates": "2dsphere" });

module.exports = mongoose.model("User", userSchema);
