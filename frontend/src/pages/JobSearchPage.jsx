import { useEffect, useState } from "react";
import JobCard from "../components/JobCard";
import NearbyJobsMap from "../components/NearbyJobsMap";
import SearchFilters from "../components/SearchFilters";
import { useAuth } from "../context/AuthContext";
import { jobService } from "../services/jobService";
import { locationService } from "../services/locationService";

const JobSearchPage = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    search: "",
    city: "",
    area: "",
    jobType: "",
    distance: "5",
  });
  const [coords, setCoords] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [bookmarks, setBookmarks] = useState(user?.bookmarks || []);

  const loadJobs = async (nextFilters = filters, nextCoords = coords) => {
    const data = await jobService.getJobs({
      ...nextFilters,
      lat: nextCoords?.lat,
      lng: nextCoords?.lng,
    });
    setJobs(data);
  };

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadJobs();
    }, 250);

    return () => clearTimeout(timeout);
  }, [filters, coords]);

  const handleFilterChange = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  const handleDetectLocation = async () => {
    try {
      const detected = await locationService.detectBrowserLocation();
      const place = await locationService.reverseGeocode(detected.latitude, detected.longitude);
      setCoords({ lat: detected.latitude, lng: detected.longitude });
      setFilters((current) => ({
        ...current,
        city: place.city || current.city,
        area: place.area || current.area,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleBookmark = async (jobId) => {
    const response = await jobService.toggleBookmark(jobId);
    setBookmarks(response.bookmarks);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-teal">
          Nearby jobs
        </div>
        <h1 className="section-title">Search jobs in your city, area, or walking radius</h1>
      </div>

      <SearchFilters filters={filters} onChange={handleFilterChange} onDetectLocation={handleDetectLocation} />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              onBookmark={handleBookmark}
              showBookmark={user?.role === "seeker"}
              bookmarked={bookmarks.some((bookmark) => String(bookmark) === String(job._id))}
            />
          ))}
          {!jobs.length && (
            <div className="card-surface p-8 text-center text-white/55">
              No jobs matched these filters. Try increasing the distance or clearing the job type.
            </div>
          )}
        </div>
        <NearbyJobsMap coords={coords} jobs={jobs} />
      </div>
    </div>
  );
};

export default JobSearchPage;
