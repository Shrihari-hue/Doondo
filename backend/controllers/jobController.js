const Application = require("../models/Application");
const Job = require("../models/Job");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { canPostJob } = require("../utils/subscription");

const listJobs = async (req, res, next) => {
  try {
    const { city, area, distance, jobType, lat, lng, search } = req.query;
    const query = { status: "open" };

    if (city) {
      query["location.city"] = new RegExp(city, "i");
    }

    if (area) {
      query["location.area"] = new RegExp(area, "i");
    }

    if (jobType) {
      query.jobType = jobType;
    }

    if (search) {
      query.$or = [
        { title: new RegExp(search, "i") },
        { companyName: new RegExp(search, "i") },
        { requiredSkills: new RegExp(search, "i") },
      ];
    }

    if (lat && lng) {
      query["location.coordinates"] = {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)],
          },
          $maxDistance: Number(distance || 5) * 1000,
        },
      };
    }

    let jobsQuery = Job.find(query).populate(
      "employer",
      "name employerProfile subscription"
    );

    if (!(lat && lng)) {
      jobsQuery = jobsQuery.sort({ priorityListing: -1, createdAt: -1 });
    }

    const jobs = await jobsQuery;

    return res.json(jobs);
  } catch (error) {
    return next(error);
  }
};

const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      "employer",
      "name phone email profilePhoto employerProfile location subscription"
    );

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.json(job);
  } catch (error) {
    return next(error);
  }
};

const createJob = async (req, res, next) => {
  try {
    const employer = await User.findById(req.user._id);
    const activeJobsCount = await Job.countDocuments({
      employer: employer._id,
      status: "open",
    });

    if (!canPostJob(employer.subscription, activeJobsCount)) {
      return res.status(403).json({
        message: "An active subscription is required before posting jobs",
      });
    }

    const job = await Job.create({
      ...req.body,
      employer: employer._id,
      companyName:
        req.body.companyName || employer.employerProfile.businessName || employer.name,
      priorityListing: employer.subscription.priorityListing,
    });

    const matchingSeekers = await User.find({
      role: "seeker",
      "location.city": new RegExp(job.location.city, "i"),
      $or: [
        { "seekerProfile.preferredJobType": job.jobType },
        { "seekerProfile.preferredJobType": "both" },
      ],
    }).select("_id");

    if (matchingSeekers.length) {
      const notifications = matchingSeekers.map((user) => ({
        user: user._id,
        title: "New job near you",
        message: `${job.title} at ${job.companyName} is now open in ${job.location.city}`,
        type: "job",
        metadata: { jobId: job._id },
      }));

      await Notification.insertMany(notifications);

      const io = req.app.get("io");
      matchingSeekers.forEach((user) => {
        io.to(String(user._id)).emit("notification:new", {
          title: "New job near you",
          message: `${job.title} at ${job.companyName} is now open in ${job.location.city}`,
          metadata: { jobId: job._id },
        });
      });
    }

    return res.status(201).json(job);
  } catch (error) {
    return next(error);
  }
};

const applyToJob = async (req, res, next) => {
  try {
    const jobId = req.body.jobId || req.params.id;
    const { coverLetter } = req.body;
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const application = await Application.create({
      job: job._id,
      seeker: req.user._id,
      employer: job.employer,
      coverLetter,
    });

    const notification = await Notification.create({
      user: job.employer,
      title: "New application received",
      message: `${req.user.name} applied for ${job.title}`,
      type: "application",
      metadata: { jobId: job._id },
    });

    req.app.get("io").to(String(job.employer)).emit("notification:new", notification);

    return res.status(201).json(application);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "You already applied to this job" });
    }

    return next(error);
  }
};

const toggleBookmark = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const { id } = req.params;
    const hasBookmark = user.bookmarks.some((bookmark) => String(bookmark) === id);

    user.bookmarks = hasBookmark
      ? user.bookmarks.filter((bookmark) => String(bookmark) !== id)
      : [...user.bookmarks, id];

    await user.save();

    return res.json({
      message: hasBookmark ? "Bookmark removed" : "Job bookmarked",
      bookmarks: user.bookmarks,
    });
  } catch (error) {
    return next(error);
  }
};

const getSavedJobs = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "bookmarks",
      options: { sort: { createdAt: -1 } },
    });

    return res.json(user.bookmarks);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listJobs,
  getJobById,
  createJob,
  applyToJob,
  toggleBookmark,
  getSavedJobs,
};
