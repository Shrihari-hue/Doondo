const Application = require("../models/Application");
const Job = require("../models/Job");
const Notification = require("../models/Notification");

const getEmployerJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ employer: req.user._id }).sort({ createdAt: -1 });
    return res.json(jobs);
  } catch (error) {
    return next(error);
  }
};

const getEmployerApplicants = async (req, res, next) => {
  try {
    const filter = { employer: req.user._id };
    if (req.query.jobId) {
      filter.job = req.query.jobId;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const sortOptions = {
      latest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      status: { status: 1, createdAt: -1 },
    };
    const sortBy = req.query.sortBy || "latest";

    const applicants = await Application.find(filter)
      .populate("job", "title companyName")
      .populate("seeker", "name email phone seekerProfile location resume profilePhoto")
      .sort(sortOptions[sortBy] || sortOptions.latest);

    return res.json(applicants);
  } catch (error) {
    return next(error);
  }
};

const updateApplicantDetails = async (req, res, next) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      employer: req.user._id,
    })
      .populate("job", "title companyName")
      .populate("seeker", "name email phone seekerProfile location resume profilePhoto");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (typeof req.body.employerNote === "string") {
      application.employerNote = req.body.employerNote.trim();
    }

    const previousInterview = application.interview?.scheduledAt
      ? {
          scheduledAt: application.interview.scheduledAt,
          mode: application.interview.mode,
          location: application.interview.location,
          meetingLink: application.interview.meetingLink,
        }
      : null;

    if (req.body.clearInterview) {
      application.interview = undefined;
    } else if (req.body.interview) {
      const interviewPayload = {
        scheduledAt: req.body.interview.scheduledAt
          ? new Date(req.body.interview.scheduledAt)
          : undefined,
        mode: req.body.interview.mode || undefined,
        location: req.body.interview.location?.trim() || undefined,
        meetingLink: req.body.interview.meetingLink?.trim() || undefined,
        note: req.body.interview.note?.trim() || undefined,
      };

      application.interview = interviewPayload;
    }

    await application.save();

    const currentInterview = application.interview?.scheduledAt
      ? {
          scheduledAt: application.interview.scheduledAt,
          mode: application.interview.mode,
          location: application.interview.location,
          meetingLink: application.interview.meetingLink,
        }
      : null;

    const interviewChanged =
      JSON.stringify(previousInterview) !== JSON.stringify(currentInterview);

    if (interviewChanged) {
      const hasInterview = Boolean(currentInterview?.scheduledAt);
      const formattedDate = hasInterview
        ? new Date(currentInterview.scheduledAt).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "";

      const notification = await Notification.create({
        user: application.seeker._id,
        title: hasInterview ? "Interview scheduled" : "Interview update",
        message: hasInterview
          ? `Your interview for ${application.job.title} is set for ${formattedDate}.`
          : `Your interview details for ${application.job.title} were updated.`,
        type: "application",
        metadata: { jobId: application.job._id },
      });

      req.app.get("io").to(String(application.seeker._id)).emit("notification:new", notification);
    }

    return res.json(application);
  } catch (error) {
    return next(error);
  }
};

const updateApplicantStatus = async (req, res, next) => {
  try {
    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, employer: req.user._id },
      { status: req.body.status },
      { new: true, runValidators: true }
    )
      .populate("job", "title companyName")
      .populate("seeker", "name email phone seekerProfile location resume profilePhoto");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const notification = await Notification.create({
      user: application.seeker._id,
      title: "Application status updated",
      message: `Your application for ${application.job.title} is now ${req.body.status}.`,
      type: "application",
      metadata: { jobId: application.job._id },
    });

    req.app.get("io").to(String(application.seeker._id)).emit("notification:new", notification);

    return res.json(application);
  } catch (error) {
    return next(error);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, employer: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.json(job);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getEmployerJobs,
  getEmployerApplicants,
  updateApplicantDetails,
  updateApplicantStatus,
  updateJob,
};
