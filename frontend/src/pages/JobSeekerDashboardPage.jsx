import { Bookmark, BriefcaseBusiness, CheckCircle2, MapPinned, UserPen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Toast from "../components/Toast";
import { Link, useLocation } from "react-router-dom";
import ChatPanel from "../components/ChatPanel";
import JobCard from "../components/JobCard";
import ProfileAssetsPanel from "../components/ProfileAssetsPanel";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import { jobService } from "../services/jobService";

const JobSeekerDashboardPage = () => {
  const { user, refreshProfile } = useAuth();
  const location = useLocation();
  const applicationsSectionRef = useRef(null);
  const messagesSectionRef = useRef(null);
  const [profileData, setProfileData] = useState(null);
  const [savedJobs, setSavedJobs] = useState([]);
  const [toast, setToast] = useState({ tone: "", message: "" });

  useEffect(() => {
    if (!toast.message) {
      return undefined;
    }

    const timeout = setTimeout(() => setToast({ tone: "", message: "" }), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    authService.getProfile().then(setProfileData);
    jobService.getSavedJobs().then(setSavedJobs);
  }, []);

  useEffect(() => {
    if (location.state?.focus === "applications") {
      applicationsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (location.state?.focus === "chat") {
      messagesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.state]);

  const handleBookmark = async (jobId) => {
    await jobService.toggleBookmark(jobId);
    const nextSavedJobs = await jobService.getSavedJobs();
    setSavedJobs(nextSavedJobs);
    await refreshProfile();
  };

  return (
    <div className="space-y-6">
      <Toast tone={toast.tone} message={toast.message} onClose={() => setToast({ tone: "", message: "" })} />
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card-surface p-5">
          <div className="mb-3 inline-flex rounded-2xl bg-teal/10 p-3 text-teal">
            <BriefcaseBusiness size={20} />
          </div>
          <div className="text-sm text-white/50">Applied jobs</div>
          <div className="mt-1 font-display text-4xl">{profileData?.appliedJobs?.length || 0}</div>
        </div>
        <div className="card-surface p-5">
          <div className="mb-3 inline-flex rounded-2xl bg-coral/10 p-3 text-coral">
            <Bookmark size={20} />
          </div>
          <div className="text-sm text-white/50">Saved jobs</div>
          <div className="mt-1 font-display text-4xl">{savedJobs.length}</div>
        </div>
        <div className="card-surface p-5">
          <div className="mb-3 inline-flex rounded-2xl bg-white/10 p-3 text-white">
            <MapPinned size={20} />
          </div>
          <div className="text-sm text-white/50">Preferred type</div>
          <div className="mt-1 font-display text-2xl capitalize">{user?.seekerProfile?.preferredJobType || "both"}</div>
        </div>
      </section>

      <section className="card-surface p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="section-title">Welcome back, {user?.name}</h1>
            <p className="mt-2 text-white/60">
              Manage applications, saved jobs, and employer conversations in one place.
            </p>
          </div>
          <Link to="/profile" className="button-secondary gap-2">
            <UserPen size={16} />
            Edit profile
          </Link>
        </div>
      </section>

      <ProfileAssetsPanel
        onSuccess={(message) => setToast({ tone: "success", message })}
        onError={(message) => setToast({ tone: "error", message })}
      />

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div ref={applicationsSectionRef} className="card-surface p-6">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-teal" />
            <h2 className="font-display text-2xl">Applications</h2>
          </div>
          <div className="space-y-4">
            {profileData?.appliedJobs?.length ? (
              profileData.appliedJobs.map((application) => (
                <div key={application._id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="font-semibold">{application.job?.title}</div>
                  <div className="mt-1 text-sm text-white/60">{application.job?.companyName}</div>
                  <div className="mt-3 inline-flex rounded-full bg-teal/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-teal">
                    {application.status}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/55">
                You have not applied for a job yet.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card-surface p-6">
            <h2 className="font-display text-2xl">Saved jobs</h2>
          </div>
          <div className="space-y-4">
            {savedJobs.length ? (
              savedJobs.map((job) => (
                <JobCard key={job._id} job={job} onBookmark={handleBookmark} showBookmark bookmarked />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/55">
                Bookmark jobs from the search page to compare openings later.
              </div>
            )}
          </div>
        </div>
      </section>

      <section ref={messagesSectionRef}>
        <h2 className="mb-4 font-display text-2xl">Messages</h2>
        <ChatPanel initialConversationId={location.state?.conversationId} />
      </section>
    </div>
  );
};

export default JobSeekerDashboardPage;
