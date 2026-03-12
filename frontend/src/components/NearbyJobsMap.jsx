import { MapPin } from "lucide-react";
import { locationService } from "../services/locationService";

const NearbyJobsMap = ({ coords, jobs }) => {
  const mapUrl = locationService.getStaticMapUrl({
    lat: coords?.lat,
    lng: coords?.lng,
    jobs,
  });

  return (
    <div className="card-surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <h3 className="font-display text-xl">Map-based job finder</h3>
          <p className="text-sm text-white/55">Jobs within your chosen radius</p>
        </div>
        <div className="rounded-full bg-coral/15 px-3 py-1 text-xs text-coral">
          {jobs.length} markers
        </div>
      </div>

      {mapUrl ? (
        <img src={mapUrl} alt="Nearby jobs map" className="h-[340px] w-full object-cover" />
      ) : (
        <div className="grid h-[340px] place-items-center bg-hero-grid bg-hero-grid">
          <div className="space-y-3 text-center">
            <div className="mx-auto inline-flex rounded-full border border-white/15 bg-white/5 p-4">
              <MapPin />
            </div>
            <div className="text-sm text-white/60">Add a Geoapify API key to enable live map previews.</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NearbyJobsMap;
