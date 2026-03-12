require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");

const DEMO_EMAILS = [
  "owner@doondo.demo",
  "manager@doondo.demo",
  "seeker@doondo.demo",
];

const run = async () => {
  await connectDB();

  const demoUsers = await User.find({ email: { $in: DEMO_EMAILS } }).select("_id");
  const demoUserIds = demoUsers.map((user) => user._id);

  const demoJobs = await Job.find({ employer: { $in: demoUserIds } }).select("_id");
  const demoJobIds = demoJobs.map((job) => job._id);

  const demoConversations = await Conversation.find({
    $or: [
      { participants: { $in: demoUserIds } },
      { job: { $in: demoJobIds } },
    ],
  }).select("_id");
  const demoConversationIds = demoConversations.map((conversation) => conversation._id);

  await User.updateMany({}, { $pull: { bookmarks: { $in: demoJobIds } } });

  await Promise.all([
    Message.deleteMany({ conversation: { $in: demoConversationIds } }),
    Notification.deleteMany({
      $or: [
        { user: { $in: demoUserIds } },
        { "metadata.jobId": { $in: demoJobIds } },
        { "metadata.conversationId": { $in: demoConversationIds } },
      ],
    }),
    Application.deleteMany({
      $or: [
        { seeker: { $in: demoUserIds } },
        { employer: { $in: demoUserIds } },
        { job: { $in: demoJobIds } },
      ],
    }),
    Conversation.deleteMany({ _id: { $in: demoConversationIds } }),
    Job.deleteMany({ _id: { $in: demoJobIds } }),
    User.deleteMany({ _id: { $in: demoUserIds } }),
  ]);

  console.log("Demo data removed successfully.");
  console.log(`Deleted demo users: ${demoUserIds.length}`);
  console.log(`Deleted demo jobs: ${demoJobIds.length}`);

  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error("Cleanup failed:", error);
  await mongoose.connection.close();
  process.exit(1);
});
