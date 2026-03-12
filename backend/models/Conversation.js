const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
    lastMessage: String,
    lastMessageAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);
