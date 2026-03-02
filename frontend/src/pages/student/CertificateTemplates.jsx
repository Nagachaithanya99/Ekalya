import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Loader from "../../components/Loader";
import {
  getCertificateTemplates,
  getMyAllCertificates,
  selectCertificateTemplate,
} from "../../services/certificateService";

const previewThemes = {
  "classic-blue": {
    bg: "from-white via-white to-sky-100",
    accent: "bg-sky-500",
    nameColor: "text-sky-500",
  },
  academy: {
    bg: "from-cyan-900 via-cyan-700 to-emerald-500",
    accent: "bg-white/90",
    nameColor: "text-cyan-700",
  },
  ribbon: {
    bg: "from-slate-100 via-slate-50 to-slate-200",
    accent: "bg-blue-600",
    nameColor: "text-blue-700",
  },
};

export default function CertificateTemplates() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const preferredCourseId = search.get("courseId");

  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [certs, setCerts] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(preferredCourseId || "");
  const [selectedTemplateKey, setSelectedTemplateKey] = useState("classic-blue");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [tRes, cRes] = await Promise.all([
          getCertificateTemplates(),
          getMyAllCertificates(),
        ]);
        setTemplates(Array.isArray(tRes.data) ? tRes.data : []);
        const all = Array.isArray(cRes.data) ? cRes.data : [];
        setCerts(all);

        const defaultCert =
          all.find((c) => c.course?._id === preferredCourseId) || all[0] || null;
        if (defaultCert) {
          setSelectedCourseId(defaultCert.course?._id || "");
          setSelectedTemplateKey(defaultCert.templateKey || "classic-blue");
        }
      } catch (err) {
        console.error(err);
        setTemplates([]);
        setCerts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [preferredCourseId]);

  const selectedCert = useMemo(
    () => certs.find((c) => c.course?._id === selectedCourseId) || null,
    [certs, selectedCourseId]
  );

  const applyTemplate = async () => {
    if (!selectedCourseId || !selectedTemplateKey) {
      alert("Select course and template");
      return;
    }

    try {
      setSaving(true);
      await selectCertificateTemplate(selectedCourseId, selectedTemplateKey);
      alert("Template saved successfully.");
      navigate("/student/certificates");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading templates..." />;

  if (certs.length === 0) {
    return (
      <div className="glass rounded-3xl p-6 border border-white/10 text-white/70">
        No certificate found yet. Complete your course first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6 border border-white/10">
        <p className="text-xs tracking-[0.25em] text-white/60">
          STUDENT • CERTIFICATES • TEMPLATES
        </p>
        <h1 className="mt-2 text-3xl font-extrabold">
          Choose Certificate <span className="text-gold">Template</span>
        </h1>
        <p className="mt-2 text-white/70">
          Select your course and choose the exact design style for your certificate.
        </p>
      </div>

      <div className="glass rounded-3xl p-6 border border-white/10 space-y-4">
        <label className="block text-sm">
          <span className="text-white/70">Course</span>
          <select
            value={selectedCourseId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedCourseId(id);
              const cert = certs.find((c) => c.course?._id === id);
              if (cert?.templateKey) setSelectedTemplateKey(cert.templateKey);
            }}
            className="mt-2 w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/15"
          >
            {certs.map((c) => (
              <option key={c._id} value={c.course?._id}>
                {c.course?.title || "Course"} ({c.published ? "Published" : "Pending"})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {templates.map((t) => {
          const theme = previewThemes[t.key] || previewThemes["classic-blue"];
          const active = selectedTemplateKey === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setSelectedTemplateKey(t.key)}
              className={`text-left rounded-3xl border p-4 transition ${
                active
                  ? "border-[#f7d774]/60 bg-[#f7d774]/10"
                  : "border-white/10 bg-white/5 hover:border-white/25"
              }`}
            >
              <div
                className={`relative overflow-hidden rounded-2xl h-44 bg-gradient-to-br ${theme.bg}`}
              >
                <div className={`absolute top-0 right-0 h-full w-16 ${theme.accent} opacity-80`} />
                <div className="absolute left-4 top-4">
                  <p className="text-xl font-extrabold text-slate-800">CERTIFICATE</p>
                  <p className="text-xs text-slate-600 tracking-[0.25em]">OF ACHIEVEMENT</p>
                  <p className={`mt-6 text-3xl italic ${theme.nameColor}`}>Name Surname</p>
                </div>
              </div>
              <p className="mt-3 font-bold">{t.name}</p>
              <p className="text-xs text-white/65 mt-1">{t.description}</p>
            </button>
          );
        })}
      </div>

      <div className="glass rounded-3xl p-6 border border-white/10 flex flex-wrap gap-3">
        <button
          onClick={applyTemplate}
          disabled={saving}
          className="btn-gold"
        >
          {saving ? "Saving..." : "Save Template"}
        </button>
        <button onClick={() => navigate("/student/certificates")} className="btn-ghost">
          Cancel
        </button>
        {selectedCert && (
          <span className="text-sm text-white/60 self-center">
            Current template:{" "}
            <span className="text-white/85">{selectedCert.templateKey || "classic-blue"}</span>
          </span>
        )}
      </div>
    </div>
  );
}
