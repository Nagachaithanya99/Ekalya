import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiFilter, FiX } from "react-icons/fi";
import { getPublicCourses } from "../../services/courseService";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import SectionHeader from "../../components/ui/SectionHeader";

const normalize = (v) => String(v || "").trim();

const toJobShape = (item) => {
  const stream = normalize(item.stream || item.level || "General");
  const category = normalize(item.category || "General");
  const subcategory = normalize(item.subcategory || item.subtitle || "General");
  return {
    ...item,
    stream,
    category,
    subcategory,
    salary: Number(item.price || 0) > 0 ? `₹${item.price}` : "Unpaid / Internship",
    company: item.company || "Ekalya Learning Platform",
    location: item.location || "Remote",
  };
};

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [query, setQuery] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [applied, setApplied] = useState({
    stream: "",
    category: "",
    subcategory: "",
  });
  const [draft, setDraft] = useState(applied);

  useEffect(() => {
    (async () => {
      const res = await getPublicCourses();
      const rows = Array.isArray(res.data) ? res.data.map(toJobShape) : [];
      setJobs(rows);
    })();
  }, []);

  const streams = useMemo(() => Array.from(new Set(jobs.map((j) => j.stream))), [jobs]);
  const categories = useMemo(() => {
    return Array.from(
      new Set(
        jobs
          .filter((j) => !draft.stream || j.stream === draft.stream)
          .map((j) => j.category)
      )
    );
  }, [jobs, draft.stream]);
  const subcategories = useMemo(() => {
    return Array.from(
      new Set(
        jobs
          .filter((j) => (!draft.stream || j.stream === draft.stream))
          .filter((j) => (!draft.category || j.category === draft.category))
          .map((j) => j.subcategory)
      )
    );
  }, [jobs, draft.stream, draft.category]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return jobs
      .filter((j) => (!applied.stream ? true : j.stream === applied.stream))
      .filter((j) => (!applied.category ? true : j.category === applied.category))
      .filter((j) => (!applied.subcategory ? true : j.subcategory === applied.subcategory))
      .filter((j) => {
        if (!q) return true;
        return `${j.title} ${j.description} ${j.category} ${j.subcategory}`
          .toLowerCase()
          .includes(q);
      });
  }, [jobs, applied, query]);

  const applyFilters = () => {
    setApplied(draft);
    setMobileFiltersOpen(false);
  };

  const resetFilters = () => {
    const empty = { stream: "", category: "", subcategory: "" };
    setDraft(empty);
    setApplied(empty);
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Find Jobs"
        subtitle="Explore opportunities with responsive filters and fast apply actions."
        right={
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/6 px-4 py-2 text-sm md:hidden"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <FiFilter />
            Filters
          </button>
        }
      />

      <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/5 px-3 py-2.5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by role, category..."
          className="w-full min-w-0 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <Card className="sticky top-24 p-4 space-y-3">
            <h2 className="text-base font-semibold">Filters</h2>
            <FilterFields
              values={draft}
              onChange={setDraft}
              streams={streams}
              categories={categories}
              subcategories={subcategories}
            />
            <div className="flex gap-2 pt-1">
              <Button className="flex-1" onClick={applyFilters}>
                Apply
              </Button>
              <Button className="flex-1" variant="ghost" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </Card>
        </aside>

        <section className="space-y-3">
          {filtered.map((job) => (
            <Card key={job._id} className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <h3 className="text-lg font-bold leading-tight md:text-xl">{job.title}</h3>
                  <p className="text-sm text-white/70">{job.company} • {job.location}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{job.stream}</Badge>
                    <Badge>{job.category}</Badge>
                    <Badge>{job.subcategory}</Badge>
                    <Badge className="text-[#f7d774]">{job.salary}</Badge>
                  </div>
                  <p className="line-clamp-2 text-sm text-white/65">{job.description || "No description available."}</p>
                </div>
                <div className="w-full shrink-0 sm:w-auto">
                  <Link to={`/student/jobs/${job._id}`} className="block w-full sm:w-auto">
                    <Button full className="sm:min-w-[140px]">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
          {filtered.length === 0 ? (
            <Card className="p-6 text-center text-white/70">No jobs match your filters.</Card>
          ) : null}
        </section>
      </div>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm lg:hidden">
          <div className="absolute inset-x-0 bottom-0 top-12 rounded-t-3xl border border-white/12 bg-[#0b0d14] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Filters</h2>
              <button
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/8"
                onClick={() => setMobileFiltersOpen(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="pb-24">
              <FilterFields
                values={draft}
                onChange={setDraft}
                streams={streams}
                categories={categories}
                subcategories={subcategories}
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-[#0b0d14] p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="ghost" onClick={resetFilters}>
                  Reset
                </Button>
                <Button onClick={applyFilters}>Apply Filters</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterFields({ values, onChange, streams, categories, subcategories }) {
  const set = (k, v) => onChange((prev) => ({ ...prev, [k]: v }));
  return (
    <div className="space-y-3">
      <Select
        label="Stream"
        value={values.stream}
        onChange={(e) => {
          set("stream", e.target.value);
          set("category", "");
          set("subcategory", "");
        }}
        options={streams}
      />
      <Select
        label="Category"
        value={values.category}
        onChange={(e) => {
          set("category", e.target.value);
          set("subcategory", "");
        }}
        options={categories}
      />
      <Select
        label="Subcategory"
        value={values.subcategory}
        onChange={(e) => set("subcategory", e.target.value)}
        options={subcategories}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-white/65">{label}</span>
      <select
        value={value}
        onChange={onChange}
        className="min-h-11 w-full rounded-xl border border-white/12 bg-white/6 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f7d774]/60"
      >
        <option value="">All</option>
        {options.map((x) => (
          <option key={x} value={x}>
            {x}
          </option>
        ))}
      </select>
    </label>
  );
}
