const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["job", "application", "chat", "subscription"],
      default: "job",
    },
    read: {
      type: Boolean,
      default: false,
    },
    metadata: {
      jobId: mongoose.Schema.Types.ObjectId,
      conversationId: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
