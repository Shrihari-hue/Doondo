const SearchFilters = ({ filters, onChange, onDetectLocation }) => (
  <div className="card-surface p-5">
    <div className="grid gap-4 md:grid-cols-5">
      <input
        className="input-base md:col-span-2"
        placeholder="Search company, title, skill"
        value={filters.search}
        onChange={(event) => onChange("search", event.target.value)}
      />
      <input
        className="input-base"
        placeholder="City"
        value={filters.city}
        onChange={(event) => onChange("city", event.target.value)}
      />
      <input
        className="input-base"
        placeholder="Area"
        value={filters.area}
        onChange={(event) => onChange("area", event.target.value)}
      />
      <select className="input-base" value={filters.jobType} onChange={(event) => onChange("jobType", event.target.value)}>
        <option value="">All job types</option>
        <option value="part-time">Part-time</option>
        <option value="full-time">Full-time</option>
      </select>
      <select className="input-base" value={filters.distance} onChange={(event) => onChange("distance", event.target.value)}>
        <option value="1">Within 1 km</option>
        <option value="3">Within 3 km</option>
        <option value="5">Within 5 km</option>
        <option value="10">Within 10 km</option>
      </select>
      <button type="button" onClick={onDetectLocation} className="button-secondary">
        Detect my city
      </button>
    </div>
  </div>
);

export default SearchFilters;
