require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");

const DEMO_PASSWORD = "Password123!";

const coordinates = {
  indiranagar: [77.6408, 12.9784],
  koramangala: [77.6221, 12.9352],
  whitefield: [77.7499, 12.9698],
  jayanagar: [77.5848, 12.925],
};

const run = async () => {
  await connectDB();

  await Promise.all([
    Application.deleteMany({}),
    Message.deleteMany({}),
    Conversation.deleteMany({}),
    Notification.deleteMany({}),
    Job.deleteMany({}),
    User.deleteMany({
      email: {
        $in: [
          "owner@doondo.demo",
          "seeker@doondo.demo",
          "manager@doondo.demo",
        ],
      },
    }),
  ]);

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  const employer = await User.create({
    role: "employer",
    name: "Riya Foods",
    email: "owner@doondo.demo",
    password: hashedPassword,
    phone: "9876543210",
    location: {
      city: "Bengaluru",
      area: "Indiranagar",
      address: "100 Feet Road, Indiranagar",
      coordinates: {
        type: "Point",
        coordinates: coordinates.indiranagar,
      },
    },
    employerProfile: {
      businessName: "Riya Foods Cafe",
      businessType: "Cafe",
      contactNumber: "9876543210",
      description: "Neighborhood cafe hiring for flexible shifts.",
    },
    subscription: {
      plan: "premium",
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      razorpayOrderId: "demo_order_001",
      razorpayPaymentId: "demo_payment_001",
      jobPostLimit: -1,
      priorityListing: true,
    },
  });

  const secondEmployer = await User.create({
    role: "employer",
    name: "Metro Logistics",
    email: "manager@doondo.demo",
    password: hashedPassword,
    phone: "9898989898",
    location: {
      city: "Bengaluru",
      area: "Whitefield",
      address: "ITPL Main Road, Whitefield",
      coordinates: {
        type: "Point",
        coordinates: coordinates.whitefield,
      },
    },
    employerProfile: {
      businessName: "Metro Logistics Hub",
      businessType: "Logistics",
      contactNumber: "9898989898",
      description: "Delivery and warehouse operations across east Bengaluru.",
    },
    subscription: {
      plan: "pro",
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      razorpayOrderId: "demo_order_002",
      razorpayPaymentId: "demo_payment_002",
      jobPostLimit: -1,
      priorityListing: false,
    },
  });

  const seeker = await User.create({
    role: "seeker",
    name: "Arjun Kumar",
    email: "seeker@doondo.demo",
    password: hashedPassword,
    phone: "9123456780",
    location: {
      city: "Bengaluru",
      area: "Koramangala",
      address: "5th Block, Koramangala",
      coordinates: {
        type: "Point",
        coordinates: coordinates.koramangala,
      },
    },
    seekerProfile: {
      skills: ["customer service", "cash handling", "delivery", "barista"],
      preferredJobType: "both",
      bio: "College student looking for flexible evening and weekend shifts.",
    },
  });

  const jobs = await Job.insertMany([
    {
      employer: employer._id,
      companyName: employer.employerProfile.businessName,
      title: "Cafe Crew Member",
      salary: { min: 14000, max: 18000, currency: "INR" },
      workingHours: "9 AM - 5 PM",
      jobType: "full-time",
      description: "Handle counter orders, support prep, and manage guest service during busy hours.",
      requiredSkills: ["customer service", "cash handling", "food prep"],
      workersNeeded: 2,
      location: {
        city: "Bengaluru",
        area: "Indiranagar",
        address: "100 Feet Road, Indiranagar",
        coordinates: { type: "Point", coordinates: coordinates.indiranagar },
      },
      status: "open",
      priorityListing: true,
    },
    {
      employer: employer._id,
      companyName: employer.employerProfile.businessName,
      title: "Weekend Barista",
      salary: { min: 8000, max: 12000, currency: "INR" },
      workingHours: "Sat-Sun, 8 AM - 4 PM",
      jobType: "part-time",
      description: "Prepare beverages, maintain cleanliness, and assist with weekend rush.",
      requiredSkills: ["barista", "customer service"],
      workersNeeded: 1,
      location: {
        city: "Bengaluru",
        area: "Indiranagar",
        address: "CMH Road, Indiranagar",
        coordinates: { type: "Point", coordinates: [77.6385, 12.9719] },
      },
      status: "open",
      priorityListing: true,
    },
    {
      employer: secondEmployer._id,
      companyName: secondEmployer.employerProfile.businessName,
      title: "Delivery Associate",
      salary: { min: 16000, max: 22000, currency: "INR" },
      workingHours: "10 AM - 7 PM",
      jobType: "full-time",
      description: "Complete local deliveries, update delivery status, and support hub operations.",
      requiredSkills: ["delivery", "route planning", "customer service"],
      workersNeeded: 4,
      location: {
        city: "Bengaluru",
        area: "Whitefield",
        address: "ITPL Main Road, Whitefield",
        coordinates: { type: "Point", coordinates: coordinates.whitefield },
      },
      status: "open",
      priorityListing: false,
    },
    {
      employer: secondEmployer._id,
      companyName: secondEmployer.employerProfile.businessName,
      title: "Warehouse Picker",
      salary: { min: 13000, max: 17000, currency: "INR" },
      workingHours: "6 AM - 2 PM",
      jobType: "part-time",
      description: "Sort packages, pick orders, and prepare dispatch bags for same-day routes.",
      requiredSkills: ["warehouse", "packing", "inventory"],
      workersNeeded: 3,
      location: {
        city: "Bengaluru",
        area: "Jayanagar",
        address: "4th Block, Jayanagar",
        coordinates: { type: "Point", coordinates: coordinates.jayanagar },
      },
      status: "open",
      priorityListing: false,
    },
  ]);

  seeker.bookmarks = [jobs[0]._id, jobs[2]._id];
  await seeker.save();

  await Application.create({
    job: jobs[0]._id,
    seeker: seeker._id,
    employer: employer._id,
    coverLetter: "I have prior cafe experience and can work weekdays immediately.",
    status: "reviewing",
  });

  const conversation = await Conversation.create({
    participants: [seeker._id, employer._id],
    job: jobs[0]._id,
    lastMessage: "Please share your availability for the interview.",
    lastMessageAt: new Date(),
  });

  await Message.insertMany([
    {
      conversation: conversation._id,
      sender: seeker._id,
      text: "Hi, I just applied for the Cafe Crew Member role.",
      readBy: [seeker._id],
    },
    {
      conversation: conversation._id,
      sender: employer._id,
      text: "Please share your availability for the interview.",
      readBy: [employer._id],
    },
  ]);

  await Notification.insertMany([
    {
      user: seeker._id,
      title: "Application update",
      message: "Your Cafe Crew Member application is under review.",
      type: "application",
      metadata: { jobId: jobs[0]._id },
    },
    {
      user: employer._id,
      title: "New candidate applied",
      message: "Arjun Kumar applied for Cafe Crew Member.",
      type: "application",
      metadata: { jobId: jobs[0]._id, conversationId: conversation._id },
    },
  ]);

  console.log("Demo data seeded successfully.");
  console.log("Employer login: owner@doondo.demo / Password123!");
  console.log("Seeker login: seeker@doondo.demo / Password123!");

  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error("Seed failed:", error);
  await mongoose.connection.close();
  process.exit(1);
});
