import {
  CalendarClock,
  Download,
  FileText,
  Mail,
  MessageCircle,
  Save,
  UsersRound,
  UserPen,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ChatPanel from "../components/ChatPanel";
import Toast from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { employerService } from "../services/employerService";
import { jobService } from "../services/jobService";
import { locationService } from "../services/locationService";
import ProfileAssetsPanel from "../components/ProfileAssetsPanel";
import { assetUrl } from "../utils/assets";

const initialJobForm = {
  title: "",
  salary: { min: "", max: "", currency: "INR" },
  workingHours: "",
  jobType: "part-time",
  description: "",
  requiredSkills: "",
  workersNeeded: "",
  location: {
    city: "",
    area: "",
    address: "",
    coordinates: {
      type: "Point",
      coordinates: [77.5946, 12.9716],
    },
  },
};

const normalizeOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return Number(value);
};

const toLocalDatetimeValue = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

const buildApplicantDrafts = (items) =>
  items.reduce((drafts, application) => {
    drafts[application._id] = {
      employerNote: application.employerNote || "",
      interviewScheduledAt: toLocalDatetimeValue(application.interview?.scheduledAt),
      interviewMode: application.interview?.mode || "in-person",
      interviewLocation: application.interview?.location || "",
      interviewMeetingLink: application.interview?.meetingLink || "",
      interviewNote: application.interview?.note || "",
    };

    return drafts;
  }, {});

const hasInterviewValues = (draft) =>
  Boolean(
    draft?.interviewScheduledAt ||
      (draft?.interviewLocation || "").trim() ||
      (draft?.interviewMeetingLink || "").trim() ||
      (draft?.interviewNote || "").trim()
  );

const buildMailtoLink = (application) => {
  if (!application.seeker?.email) {
    return "";
  }

  const params = new URLSearchParams({
    subject: `Regarding your application for ${application.job?.title || "our job opening"}`,
  });

  return `mailto:${application.seeker?.email}?${params.toString()}`;
};

const buildWhatsAppLink = (application) => {
  const digits = (application.seeker?.phone || "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const formattedPhone = digits.length === 10 ? `91${digits}` : digits;
  const message = encodeURIComponent(
    `Hi ${application.seeker?.name || ""}, I am reaching out about your application for ${
      application.job?.title || "our opening"
    } on Doondo.`
  );

  return `https://wa.me/${formattedPhone}?text=${message}`;
};

const formatInterviewSummary = (scheduledAt) => {
  if (!scheduledAt) {
    return "";
  }

  return new Date(scheduledAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const EmployerDashboardPage = () => {
  const { user, refreshProfile } = useAuth();
  const location = useLocation();
  const applicantsSectionRef = useRef(null);
  const chatSectionRef = useRef(null);
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [jobForm, setJobForm] = useState(initialJobForm);
  const [toast, setToast] = useState({ tone: "", message: "" });
  const [posting, setPosting] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);
  const [applicantFilters, setApplicantFilters] = useState({
    jobId: "",
    status: "",
    sortBy: "latest",
  });
  const [applicantDrafts, setApplicantDrafts] = useState({});
  const [updatingApplicantId, setUpdatingApplicantId] = useState("");
  const [savingApplicantId, setSavingApplicantId] = useState("");

  useEffect(() => {
    if (!toast.message) {
      return undefined;
    }

    const timeout = setTimeout(() => setToast({ tone: "", message: "" }), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const loadData = async () => {
    const [jobData, applicantData] = await Promise.all([
      employerService.getJobs(),
      employerService.getApplicants(applicantFilters),
    ]);

    setJobs(jobData);
    setApplicants(applicantData);
    setApplicantDrafts(buildApplicantDrafts(applicantData));
  };

  useEffect(() => {
    loadData();
  }, [applicantFilters.jobId, applicantFilters.sortBy, applicantFilters.status]);

  useEffect(() => {
    if (location.state?.focus === "applicants" && location.state?.jobId) {
      setApplicantFilters((current) => ({ ...current, jobId: location.state.jobId }));
      applicantsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (location.state?.focus === "chat") {
      chatSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.state]);

  const handleCreateJob = async (event) => {
    event.preventDefault();
    setToast({ tone: "", message: "" });
    setPosting(true);

    try {
      const geocoded = await locationService.geocodePlace(
        [jobForm.location.area, jobForm.location.city].filter(Boolean).join(", ")
      );

      await jobService.createJob({
        ...jobForm,
        companyName: user?.employerProfile?.businessName,
        salary: {
          ...jobForm.salary,
          min: normalizeOptionalNumber(jobForm.salary.min),
          max: normalizeOptionalNumber(jobForm.salary.max),
        },
        requiredSkills: jobForm.requiredSkills.split(",").map((skill) => skill.trim()).filter(Boolean),
        workersNeeded: normalizeOptionalNumber(jobForm.workersNeeded) || 1,
        location: {
          ...jobForm.location,
          coordinates: {
            type: "Point",
            coordinates: geocoded ? [geocoded.lng, geocoded.lat] : jobForm.location.coordinates.coordinates,
          },
        },
      });
      setJobForm(initialJobForm);
      await loadData();
      await refreshProfile();
      setToast({ tone: "success", message: "Job posted successfully" });
    } catch (error) {
      setToast({
        tone: "error",
        message: error.response?.data?.message || "Unable to post job",
      });
    } finally {
      setPosting(false);
    }
  };

  const handleToggleStatus = async (jobId, currentStatus) => {
    await employerService.updateJob(jobId, {
      status: currentStatus === "open" ? "closed" : "open",
    });
    loadData();
  };

  const handleApplicantStatus = async (applicationId, status) => {
    setUpdatingApplicantId(applicationId);
    try {
      await employerService.updateApplicantStatus(applicationId, status);
      await loadData();
      setToast({ tone: "success", message: `Applicant marked as ${status}` });
    } catch (error) {
      setToast({
        tone: "error",
        message: error.response?.data?.message || "Unable to update applicant status",
      });
    } finally {
      setUpdatingApplicantId("");
    }
  };

  const handleApplicantDraftChange = (applicationId, field, value) => {
    setApplicantDrafts((current) => ({
      ...current,
      [applicationId]: {
        ...current[applicationId],
        [field]: value,
      },
    }));
  };

  const handleSaveApplicantDetails = async (applicationId) => {
    const draft = applicantDrafts[applicationId];

    if (!draft) {
      return;
    }

    setSavingApplicantId(applicationId);

    try {
      const payload = {
        employerNote: draft.employerNote,
      };

      if (hasInterviewValues(draft)) {
        if (!draft.interviewScheduledAt) {
          setToast({
            tone: "error",
            message: "Choose an interview date and time before saving interview details",
          });
          setSavingApplicantId("");
          return;
        }

        payload.interview = {
          scheduledAt: draft.interviewScheduledAt,
          mode: draft.interviewMode,
          ...(draft.interviewLocation.trim() ? { location: draft.interviewLocation.trim() } : {}),
          ...(draft.interviewMeetingLink.trim() ? { meetingLink: draft.interviewMeetingLink.trim() } : {}),
          ...(draft.interviewNote.trim() ? { note: draft.interviewNote.trim() } : {}),
        };
      }

      await employerService.updateApplicantDetails(applicationId, payload);
      await loadData();
      setToast({ tone: "success", message: "Applicant details updated" });
    } catch (error) {
      setToast({
        tone: "error",
        message:
          error.response?.data?.errors?.[0]?.msg ||
          error.response?.data?.message ||
          "Unable to save applicant details",
      });
    } finally {
      setSavingApplicantId("");
    }
  };

  const handleClearInterview = async (applicationId) => {
    const draft = applicantDrafts[applicationId];

    setSavingApplicantId(applicationId);

    try {
      await employerService.updateApplicantDetails(applicationId, {
        employerNote: draft?.employerNote || "",
        clearInterview: true,
      });
      await loadData();
      setToast({ tone: "success", message: "Interview details cleared" });
    } catch (error) {
      setToast({
        tone: "error",
        message:
          error.response?.data?.errors?.[0]?.msg ||
          error.response?.data?.message ||
          "Unable to clear interview details",
      });
    } finally {
      setSavingApplicantId("");
    }
  };

  const hasActivePlan = user?.subscription?.status === "active";

  return (
    <div className="space-y-6">
      <Toast tone={toast.tone} message={toast.message} onClose={() => setToast({ tone: "", message: "" })} />
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card-surface p-5">
          <div className="text-sm text-white/50">Active plan</div>
          <div className="mt-1 font-display text-3xl capitalize">{user?.subscription?.plan || "none"}</div>
        </div>
        <div className="card-surface p-5">
          <div className="mb-3 inline-flex rounded-2xl bg-teal/10 p-3 text-teal">
            <WalletCards size={20} />
          </div>
          <div className="text-sm text-white/50">Open jobs</div>
          <div className="mt-1 font-display text-4xl">{jobs.filter((job) => job.status === "open").length}</div>
        </div>
        <div className="card-surface p-5">
          <div className="mb-3 inline-flex rounded-2xl bg-coral/10 p-3 text-coral">
            <UsersRound size={20} />
          </div>
          <div className="text-sm text-white/50">Applicants</div>
          <div className="mt-1 font-display text-4xl">{applicants.length}</div>
        </div>
      </section>

      {!hasActivePlan && (
        <section className="card-surface flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center">
          <div>
            <h1 className="section-title">Activate a subscription before posting jobs</h1>
            <p className="mt-2 text-white/60">Basic, Pro, and Premium plans are available with Razorpay UPI checkout.</p>
          </div>
          <Link to="/subscription" className="button-primary">
            Choose subscription
          </Link>
        </section>
      )}

      <section className="card-surface flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="section-title">Employer dashboard</h1>
          <p className="mt-2 text-white/60">
            Update your business details, contact number, and operating location before you post jobs.
          </p>
        </div>
        <Link to="/profile" className="button-secondary gap-2">
          <UserPen size={16} />
          Edit profile
        </Link>
      </section>

      <ProfileAssetsPanel
        onSuccess={(message) => setToast({ tone: "success", message })}
        onError={(message) => setToast({ tone: "error", message })}
      />

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <form onSubmit={handleCreateJob} className="card-surface p-6">
          <h2 className="font-display text-2xl">Post a job vacancy</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-white/55">Job title</span>
              <input className="input-base" placeholder="Senior Accountant" value={jobForm.title} onChange={(event) => setJobForm({ ...jobForm, title: event.target.value })} />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/55">Job type</span>
              <select className="input-base" value={jobForm.jobType} onChange={(event) => setJobForm({ ...jobForm, jobType: event.target.value })}>
                <option value="part-time">Part-time</option>
                <option value="full-time">Full-time</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/55">Minimum monthly salary in INR</span>
              <input
                className="input-base"
                type="number"
                min="0"
                placeholder="For example: 12000"
                value={jobForm.salary.min}
                onChange={(event) => setJobForm({ ...jobForm, salary: { ...jobForm.salary, min: event.target.value } })}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/55">Maximum monthly salary in INR</span>
              <input
                className="input-base"
                type="number"
                min="0"
                placeholder="For example: 18000"
                value={jobForm.salary.max}
                onChange={(event) => setJobForm({ ...jobForm, salary: { ...jobForm.salary, max: event.target.value } })}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/55">Working hours or shift timing</span>
              <input
                className="input-base"
                placeholder="For example: 9 AM - 6 PM"
                value={jobForm.workingHours}
                onChange={(event) => setJobForm({ ...jobForm, workingHours: event.target.value })}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/55">Number of workers needed</span>
              <input
                className="input-base"
                type="number"
                min="1"
                placeholder="For example: 2"
                value={jobForm.workersNeeded}
                onChange={(event) => setJobForm({ ...jobForm, workersNeeded: event.target.value })}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/55">City</span>
              <input
                className="input-base"
                placeholder="For example: Belthangady"
                value={jobForm.location.city}
                onChange={(event) => setJobForm({ ...jobForm, location: { ...jobForm.location, city: event.target.value } })}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/55">Area or locality</span>
              <input
                className="input-base"
                placeholder="For example: Ujire"
                value={jobForm.location.area}
                onChange={(event) => setJobForm({ ...jobForm, location: { ...jobForm.location, area: event.target.value } })}
              />
            </label>
            <input
              className="input-base md:col-span-2"
              placeholder="Required skills (comma separated)"
              value={jobForm.requiredSkills}
              onChange={(event) => setJobForm({ ...jobForm, requiredSkills: event.target.value })}
            />
            <textarea
              className="input-base md:col-span-2"
              rows="4"
              placeholder="Job description"
              value={jobForm.description}
              onChange={(event) => setJobForm({ ...jobForm, description: event.target.value })}
            />
          </div>
          <button type="submit" className="button-primary mt-5" disabled={!hasActivePlan || posting}>
            {posting ? "Posting..." : "Post vacancy"}
          </button>
        </form>

        <div className="space-y-6">
          <div ref={applicantsSectionRef} className="card-surface p-6">
            <h2 className="font-display text-2xl">Manage listings</h2>
            <div className="mt-4 space-y-4">
              {jobs.length ? (
                jobs.map((job) => (
                  <div key={job._id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold">{job.title}</div>
                        <div className="mt-1 text-sm text-white/55">
                          {[job.location.area, job.location.city].filter(Boolean).join(", ")}
                        </div>
                      </div>
                      <button type="button" onClick={() => handleToggleStatus(job._id, job.status)} className="button-secondary !px-4 !py-2">
                        {job.status === "open" ? "Close listing" : "Reopen listing"}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-white/55">
                  No job listings created yet.
                </div>
              )}
            </div>
          </div>

          <div className="card-surface p-6">
            <h2 className="font-display text-2xl">Recent applicants</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <select
                className="input-base"
                value={applicantFilters.jobId}
                onChange={(event) =>
                  setApplicantFilters((current) => ({ ...current, jobId: event.target.value }))
                }
              >
                <option value="">All jobs</option>
                {jobs.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.title}
                  </option>
                ))}
              </select>
              <select
                className="input-base"
                value={applicantFilters.status}
                onChange={(event) =>
                  setApplicantFilters((current) => ({ ...current, status: event.target.value }))
                }
              >
                <option value="">All statuses</option>
                <option value="applied">Applied</option>
                <option value="reviewing">Reviewing</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
                <option value="hired">Hired</option>
              </select>
              <select
                className="input-base"
                value={applicantFilters.sortBy}
                onChange={(event) =>
                  setApplicantFilters((current) => ({ ...current, sortBy: event.target.value }))
                }
              >
                <option value="latest">Latest first</option>
                <option value="oldest">Oldest first</option>
                <option value="status">Sort by status</option>
              </select>
            </div>
            <div className="mt-4 space-y-4">
              {applicants.length ? (
                applicants.slice(0, 6).map((application) => (
                  <div key={application._id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    {(() => {
                      const draft = applicantDrafts[application._id] || {
                        employerNote: "",
                        interviewScheduledAt: "",
                        interviewMode: "in-person",
                        interviewLocation: "",
                        interviewMeetingLink: "",
                        interviewNote: "",
                      };
                      const emailLink = buildMailtoLink(application);
                      const whatsappLink = buildWhatsAppLink(application);

                      return (
                    <>
                    <div className="flex items-start gap-3">
                      {application.seeker?.profilePhoto?.url ? (
                        <img
                          src={assetUrl(application.seeker.profilePhoto.url)}
                          alt={application.seeker.name}
                          className="h-16 w-16 rounded-3xl object-cover"
                        />
                      ) : (
                        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-coral text-lg font-bold text-white">
                          {(application.seeker?.name || "U").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold">{application.seeker?.name}</div>
                        <div className="mt-1 text-sm text-white/55">{application.job?.title}</div>
                        <div className="mt-2 text-sm text-white/65">{application.seeker?.email}</div>
                        <div className="mt-3 inline-flex rounded-full bg-coral/15 px-3 py-1 text-xs uppercase tracking-[0.18em] text-coral">
                          {application.status}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(application.seeker?.seekerProfile?.skills || []).slice(0, 6).map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/75"
                            >
                              {skill}
                            </span>
                          ))}
                          {!application.seeker?.seekerProfile?.skills?.length && (
                            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/45">
                              No skills added yet
                            </span>
                          )}
                        </div>
                        {application.seeker?.resume?.url && (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedResume({
                                name: application.seeker.name,
                                fileName: application.seeker.resume.originalName || "Resume",
                                url: assetUrl(application.seeker.resume.url),
                                mimeType: application.seeker.resume.mimeType,
                              })
                            }
                            className="mt-4 inline-flex rounded-2xl border border-teal/30 bg-teal/10 px-4 py-2 text-sm text-teal"
                          >
                            Open resume
                          </button>
                        )}
                        {!application.seeker?.resume?.url && (
                          <div className="mt-4 text-xs text-white/45">Resume not uploaded yet</div>
                        )}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {[
                            ["reviewing", "Review"],
                            ["shortlisted", "Shortlist"],
                            ["rejected", "Reject"],
                            ["hired", "Hire"],
                          ].map(([status, label]) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleApplicantStatus(application._id, status)}
                              disabled={updatingApplicantId === application._id || application.status === status}
                              className="button-secondary !px-4 !py-2 disabled:opacity-50"
                            >
                              {updatingApplicantId === application._id && application.status !== status
                                ? "Updating..."
                                : label}
                            </button>
                          ))}
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          {emailLink ? (
                            <a
                              href={emailLink}
                              className="button-secondary !justify-center gap-2 !px-4 !py-3"
                            >
                              <Mail size={16} />
                              Email seeker
                            </a>
                          ) : (
                            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-3 text-center text-sm text-white/45">
                              Email unavailable
                            </div>
                          )}
                          {whatsappLink ? (
                            <a
                              href={whatsappLink}
                              target="_blank"
                              rel="noreferrer"
                              className="button-secondary !justify-center gap-2 !px-4 !py-3"
                            >
                              <MessageCircle size={16} />
                              WhatsApp
                            </a>
                          ) : (
                            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-3 text-center text-sm text-white/45">
                              WhatsApp unavailable
                            </div>
                          )}
                        </div>

                        <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-white/85">
                            <CalendarClock size={16} className="text-coral" />
                            Interview schedule
                          </div>
                          {application.interview?.scheduledAt && (
                            <div className="mt-2 rounded-2xl bg-white/5 px-3 py-2 text-sm text-white/65">
                              Scheduled for {formatInterviewSummary(application.interview.scheduledAt)}
                            </div>
                          )}
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <input
                              type="datetime-local"
                              className="input-base"
                              value={draft.interviewScheduledAt}
                              onChange={(event) =>
                                handleApplicantDraftChange(application._id, "interviewScheduledAt", event.target.value)
                              }
                            />
                            <select
                              className="input-base"
                              value={draft.interviewMode}
                              onChange={(event) =>
                                handleApplicantDraftChange(application._id, "interviewMode", event.target.value)
                              }
                            >
                              <option value="in-person">In person</option>
                              <option value="video">Video</option>
                              <option value="phone">Phone</option>
                            </select>
                            <input
                              className="input-base"
                              placeholder="Office address or meetup point"
                              value={draft.interviewLocation}
                              onChange={(event) =>
                                handleApplicantDraftChange(application._id, "interviewLocation", event.target.value)
                              }
                            />
                            <input
                              className="input-base"
                              placeholder="Meeting link"
                              value={draft.interviewMeetingLink}
                              onChange={(event) =>
                                handleApplicantDraftChange(application._id, "interviewMeetingLink", event.target.value)
                              }
                            />
                            <textarea
                              rows="3"
                              className="input-base md:col-span-2"
                              placeholder="Interview note for the seeker"
                              value={draft.interviewNote}
                              onChange={(event) =>
                                handleApplicantDraftChange(application._id, "interviewNote", event.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
                          <div className="text-sm font-semibold text-white/85">Employer note</div>
                          <textarea
                            rows="4"
                            className="input-base mt-3"
                            placeholder="Add internal notes about this applicant"
                            value={draft.employerNote}
                            onChange={(event) =>
                              handleApplicantDraftChange(application._id, "employerNote", event.target.value)
                            }
                          />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveApplicantDetails(application._id)}
                            disabled={savingApplicantId === application._id}
                            className="button-primary gap-2 !px-4 !py-3 disabled:opacity-50"
                          >
                            <Save size={16} />
                            {savingApplicantId === application._id ? "Saving..." : "Save details"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleClearInterview(application._id)}
                            disabled={savingApplicantId === application._id || !application.interview?.scheduledAt}
                            className="button-secondary !px-4 !py-3 disabled:opacity-50"
                          >
                            Clear interview
                          </button>
                        </div>
                      </div>
                    </div>
                    </>
                      );
                    })()}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-white/55">
                  Applicants will appear here after job seekers apply.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section ref={chatSectionRef}>
        <h2 className="mb-4 font-display text-2xl">Hiring conversations</h2>
        <ChatPanel initialConversationId={location.state?.conversationId} />
      </section>

      {selectedResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-4xl rounded-[28px] border border-white/10 bg-[#101917] p-6 shadow-glow">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl">{selectedResume.name}'s resume</h3>
                <p className="mt-1 text-sm text-white/55">{selectedResume.fileName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResume(null)}
                className="rounded-2xl border border-white/10 p-3"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
              {selectedResume.mimeType === "application/pdf" ? (
                <iframe
                  src={selectedResume.url}
                  title={`${selectedResume.name} resume`}
                  className="h-[70vh] w-full rounded-2xl bg-white"
                />
              ) : (
                <div className="grid h-[50vh] place-items-center rounded-2xl border border-dashed border-white/10 text-center">
                  <div>
                    <div className="mx-auto inline-flex rounded-2xl bg-white/5 p-4">
                      <FileText size={24} />
                    </div>
                    <div className="mt-3 text-sm text-white/65">
                      Preview is available for PDFs only. Download the file to review it.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={selectedResume.url}
                download
                className="button-primary gap-2"
              >
                <Download size={16} />
                Download resume
              </a>
              <button type="button" onClick={() => setSelectedResume(null)} className="button-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerDashboardPage;
