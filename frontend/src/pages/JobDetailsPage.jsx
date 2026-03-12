import { ArrowLeft, BookmarkPlus, Building2, Mail, MapPin, MessageCircleMore, PhoneCall } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { chatService } from "../services/chatService";
import { jobService } from "../services/jobService";
import { assetUrl } from "../utils/assets";
import { formatSalary, formatSkills } from "../utils/formatters";

const JobDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    jobService.getJobById(id).then(setJob);
  }, [id]);

  const handleApply = async () => {
    await jobService.applyToJob({ jobId: id });
    setStatus("Application submitted");
  };

  const handleBookmark = async () => {
    await jobService.toggleBookmark(id);
    setStatus("Job bookmarked");
  };

  const handleContact = async () => {
    if (!job?.employer?._id) {
      return;
    }

    const conversation = await chatService.createConversation({
      recipientId: job.employer._id,
      jobId: id,
    });
    navigate(user?.role === "employer" ? "/dashboard/employer" : "/dashboard/seeker", {
      state: { conversationId: conversation._id },
    });
  };

  if (!job) {
    return <div className="px-6 py-20 text-center text-white/70">Loading job details...</div>;
  }

  const businessName = job.employer?.employerProfile?.businessName || job.employer?.name;
  const businessLocation = [
    job.employer?.location?.area,
    job.employer?.location?.city,
    job.employer?.location?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      <Link to="/jobs" className="inline-flex items-center gap-2 text-sm text-white/65">
        <ArrowLeft size={16} />
        Back to jobs
      </Link>

      <section className="card-surface p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-coral/15 px-3 py-1 text-xs uppercase tracking-[0.24em] text-coral">
              {job.jobType}
            </div>
            <h1 className="font-display text-4xl">{job.title}</h1>
            <p className="mt-2 text-white/60">
              {job.companyName} · {[job.location.area, job.location.city].filter(Boolean).join(", ")}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
            <div className="text-sm text-white/55">Salary</div>
            <div className="mt-1 font-display text-2xl">{formatSalary(job.salary)}</div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold">Job description</h2>
              <p className="mt-2 text-white/70">{job.description}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Required skills</h2>
              <p className="mt-2 text-white/70">{formatSkills(job.requiredSkills)}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Working hours</h2>
              <p className="mt-2 text-white/70">{job.workingHours}</p>
            </div>
            <div className="card-surface p-5">
              <div className="mb-3 flex items-center gap-2 text-sm text-white/55">
                <Building2 size={16} />
                Business details
              </div>
              <div className="flex items-start gap-4">
                {job.employer?.profilePhoto?.url ? (
                  <img
                    src={assetUrl(job.employer.profilePhoto.url)}
                    alt={businessName}
                    className="h-16 w-16 rounded-3xl object-cover"
                  />
                ) : (
                  <div className="grid h-16 w-16 place-items-center rounded-3xl bg-coral font-display text-xl text-white">
                    {(businessName || "B").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-display text-2xl">{businessName}</div>
                  <div className="mt-1 text-sm text-white/60">
                    {job.employer?.employerProfile?.businessType || "Local business"}
                  </div>
                  {businessLocation && (
                    <div className="mt-3 flex items-start gap-2 text-sm text-white/65">
                      <MapPin size={15} className="mt-0.5 shrink-0" />
                      <span>{businessLocation}</span>
                    </div>
                  )}
                  {job.employer?.location?.address && (
                    <div className="mt-2 text-sm text-white/60">{job.employer.location.address}</div>
                  )}
                  {job.employer?.employerProfile?.description && (
                    <p className="mt-3 text-sm text-white/70">{job.employer.employerProfile.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card-surface p-5">
              <div className="text-sm text-white/50">Contact employer</div>
              <div className="mt-2 font-display text-2xl">{businessName}</div>
              <div className="mt-3 space-y-2 text-sm text-white/65">
                <div>{job.employer?.phone || job.employer?.employerProfile?.contactNumber || "Contact shared after application"}</div>
                <div className="flex items-center gap-2">
                  <Mail size={15} />
                  {job.employer?.email}
                </div>
              </div>
            </div>
            {user?.role === "seeker" && (
              <div className="space-y-3">
                <button type="button" onClick={handleApply} className="button-primary w-full">
                  Apply now
                </button>
                <button type="button" onClick={handleContact} className="button-secondary w-full gap-2">
                  <MessageCircleMore size={16} />
                  Contact employer
                </button>
                <button type="button" onClick={handleBookmark} className="button-secondary w-full gap-2">
                  <BookmarkPlus size={16} />
                  Save job
                </button>
              </div>
            )}
            {!user && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                Login as a job seeker to apply, bookmark, or start a chat with the employer.
              </div>
            )}
            {status && (
              <div className="rounded-2xl bg-teal/10 px-4 py-3 text-sm text-teal">
                {status}
              </div>
            )}
            <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-white/55">
              <div className="mb-2 flex items-center gap-2 font-semibold text-white/70">
                <PhoneCall size={15} />
                Workers needed
              </div>
              {job.workersNeeded} candidates
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default JobDetailsPage;
