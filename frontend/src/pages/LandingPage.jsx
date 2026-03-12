import { ArrowRight, Building2, MapPinned, Sparkles, UserRoundSearch } from "lucide-react";
import { Link } from "react-router-dom";

const LandingPage = () => (
  <div className="space-y-12">
    <section className="grid items-center gap-8 overflow-hidden rounded-[32px] border border-white/10 bg-hero-grid bg-hero-grid px-6 py-10 md:grid-cols-[1.2fr_0.8fr] md:px-10 md:py-16">
      <div>
        <div className="mb-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-teal">
          City-first job discovery
        </div>
        <h1 className="max-w-3xl font-display text-4xl leading-tight md:text-6xl">
          Find nearby work. Fill nearby shifts. Move local hiring faster.
        </h1>
        <p className="mt-5 max-w-2xl text-base text-white/70 md:text-lg">
          Doondo connects local businesses with part-time and full-time job seekers using city, area, and distance-based discovery.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/jobs" className="button-primary gap-2">
            Explore jobs
            <ArrowRight size={16} />
          </Link>
          <Link to="/signup" className="button-secondary">
            Create account
          </Link>
        </div>
      </div>

      <div className="card-surface p-5 md:p-6">
        <div className="grid gap-4">
          {[
            ["Jobs within 1 km", "Barista, delivery, cashier, receptionist"],
            ["Jobs within 3 km", "Retail floor, kitchen helper, telecaller"],
            ["Jobs within 5 km", "Warehouse, clinic staff, office support"],
          ].map(([title, text]) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="font-display text-lg">{title}</div>
              <div className="mt-2 text-sm text-white/60">{text}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="grid gap-5 md:grid-cols-3">
      {[
        {
          icon: <MapPinned size={22} />,
          title: "Map-based finder",
          text: "Filter jobs within 1 km, 3 km, 5 km, or 10 km around the user.",
        },
        {
          icon: <Building2 size={22} />,
          title: "Subscription posting",
          text: "Businesses subscribe with Razorpay before opening vacancies.",
        },
        {
          icon: <UserRoundSearch size={22} />,
          title: "Local hiring funnel",
          text: "Search, apply, bookmark, chat, and track hiring status in one place.",
        },
      ].map((item) => (
        <article key={item.title} className="card-surface p-6">
          <div className="mb-4 inline-flex rounded-2xl bg-coral/10 p-3 text-coral">{item.icon}</div>
          <h2 className="font-display text-2xl">{item.title}</h2>
          <p className="mt-3 text-white/60">{item.text}</p>
        </article>
      ))}
    </section>

    <section className="card-surface flex flex-col items-start justify-between gap-4 p-8 md:flex-row md:items-center">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-teal">
          <Sparkles size={16} />
          Built for mobile-first hiring
        </div>
        <h2 className="section-title">Job seekers discover faster. Employers hire faster.</h2>
      </div>
      <Link to="/signup" className="button-primary">
        Start now
      </Link>
    </section>
  </div>
);

export default LandingPage;
