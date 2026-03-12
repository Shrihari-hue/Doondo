import { Bookmark, BriefcaseBusiness, Clock3, IndianRupee, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { formatSalary, formatSkills } from "../utils/formatters";

const JobCard = ({ job, onBookmark, bookmarked = false, showBookmark = false }) => (
  <article className="card-surface p-5 transition hover:-translate-y-1 hover:border-teal/30">
    <div className="flex items-start justify-between gap-3">
      <Link to={`/jobs/${job._id}`} className="block flex-1">
        <div className="mb-2 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-teal">
          {job.jobType}
        </div>
        <h3 className="font-display text-xl transition hover:text-teal">{job.title}</h3>
        <div className="mt-1 flex items-center gap-2 text-sm text-white/60">
          <BriefcaseBusiness size={15} />
          {job.companyName}
        </div>
      </Link>
      {showBookmark && (
        <button type="button" onClick={() => onBookmark(job._id)} className="rounded-2xl border border-white/10 p-3">
          <Bookmark size={18} fill={bookmarked ? "currentColor" : "none"} />
        </button>
      )}
    </div>

    <div className="mt-5 grid gap-3 text-sm text-white/70 md:grid-cols-2">
      <div className="flex items-center gap-2">
        <IndianRupee size={15} />
        {formatSalary(job.salary)}
      </div>
      <div className="flex items-center gap-2">
        <Clock3 size={15} />
        {job.workingHours}
      </div>
      <div className="flex items-center gap-2 md:col-span-2">
        <MapPin size={15} />
        {[job.location?.area, job.location?.city].filter(Boolean).join(", ")}
      </div>
    </div>

    <div className="mt-4 text-sm text-white/55">{formatSkills(job.requiredSkills)}</div>

    <div className="mt-5 flex items-center justify-between gap-3">
      <span className={`rounded-full px-3 py-1 text-xs ${job.priorityListing ? "bg-coral/20 text-coral" : "bg-white/10 text-white/70"}`}>
        {job.priorityListing ? "Priority listing" : "Standard listing"}
      </span>
      <Link to={`/jobs/${job._id}`} className="button-primary !px-4 !py-2">
        View job
      </Link>
    </div>
  </article>
);

export default JobCard;
