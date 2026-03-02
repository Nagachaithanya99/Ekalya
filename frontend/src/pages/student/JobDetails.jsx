import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiMapPin, FiBriefcase } from "react-icons/fi";
import { getCourseById } from "../../services/courseService";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import SectionHeader from "../../components/ui/SectionHeader";

const FALLBACK =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop";

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);

  useEffect(() => {
    getCourseById(id)
      .then((res) => setJob(res.data || null))
      .catch(() => setJob(null));
  }, [id]);

  const meta = useMemo(() => {
    if (!job) return null;
    return {
      title: job.title || "Role",
      stream: job.stream || job.level || "General",
      category: job.category || "General",
      subcategory: job.subcategory || job.subtitle || "General",
      company: job.company || "Ekalya Learning Platform",
      location: job.location || "Remote",
      cta: Number(job.price || 0) > 0 ? `Package: ₹${job.price}` : "Internship / Unpaid",
    };
  }, [job]);

  if (!meta) {
    return (
      <Card className="p-6 text-white/70">
        Job not found. <Link to="/student/jobs" className="text-[#f7d774]">Back to jobs</Link>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-4"
      >
        <FiArrowLeft />
        Back
      </button>

      <Card className="overflow-hidden">
        <img
          src={job.bannerUrl || job.thumbnailUrl || FALLBACK}
          alt={meta.title}
          className="aspect-[16/7] w-full object-cover"
        />
      </Card>

      <SectionHeader
        title={meta.title}
        subtitle={`${meta.company} • ${meta.location}`}
        right={<Badge className="text-[#f7d774]">{meta.cta}</Badge>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="p-5 md:p-6">
          <h2 className="text-lg font-bold md:text-xl">Job Description</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/75 md:text-base">
            {job.description || "No description available."}
          </p>
        </Card>

        <Card className="p-5 md:p-6">
          <h3 className="text-base font-bold">Overview</h3>
          <div className="mt-3 space-y-2 text-sm text-white/80">
            <div className="flex items-center gap-2"><FiBriefcase /> {meta.stream}</div>
            <div className="flex items-center gap-2"><FiMapPin /> {meta.location}</div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>{meta.category}</Badge>
            <Badge>{meta.subcategory}</Badge>
          </div>
          <Button className="mt-5 w-full">Apply Now</Button>
        </Card>
      </div>
    </div>
  );
}
