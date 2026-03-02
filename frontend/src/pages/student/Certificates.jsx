import { useEffect, useState } from "react";
import Loader from "../../components/Loader";
import { getMyCertificates } from "../../services/certificateService";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const BACKEND_ORIGIN = API_BASE.replace(/\/api$/, "");

export default function Certificates() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [certs, setCerts] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getMyCertificates();
        setCerts(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error(e);
        setCerts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Loader label="Loading certificates..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 border border-white/10 relative overflow-hidden"
      >
        <div className="aurora-line absolute top-0 left-0 right-0" />

        <div className="relative z-10">
          <p className="text-white/60 text-sm">Achievements</p>
          <h1 className="mt-1 text-3xl font-extrabold">
            My <span className="text-gold">Certificates</span>
          </h1>
          <p className="mt-2 text-white/65 max-w-2xl">
            Download certificates for completed courses. Certificates are published
            after admin verification.
          </p>
          <button
            onClick={() => navigate("/student/certificates/templates")}
            className="btn-ghost mt-4"
          >
            Choose Template
          </button>
        </div>
      </motion.div>

      {/* Empty state */}
      {certs.length === 0 ? (
        <div className="glass rounded-3xl p-8 border border-white/10 text-white/70">
          <p className="text-lg font-semibold">No certificates yet</p>
          <p className="mt-1 text-white/60">
            Complete a course fully. Once approved by admin, your certificate will
            appear here for download.
          </p>

          <div className="mt-4 text-sm text-white/55">
            Tip: Certificates unlock only at <b>100%</b> course completion.
          </div>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid sm:grid-cols-3 gap-5">
            <SummaryCard label="Published Certificates" value={certs.length} />
            <SummaryCard label="Format" value="PDF" />
            <SummaryCard label="Verification" value="Admin Approved" />
          </div>

          {/* Certificates Grid */}
          <div className="grid md:grid-cols-2 gap-5">
            {certs.map((c, idx) => {
              const downloadUrl = `${BACKEND_ORIGIN}${c.pdfPath}`;

              return (
                <motion.div
                  key={c._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * Math.min(idx, 6) }}
                  className="glass rounded-3xl p-6 border border-white/10 hover:border-white/20 relative overflow-hidden"
                >
                  {/* Glow */}
                  <div
                    className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full blur-3xl"
                    style={{ background: "rgba(247,215,116,0.18)" }}
                  />

                  <div className="relative z-10 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm text-white/60">Course</p>
                        <h3 className="font-extrabold text-lg truncate">
                          {c.course?.title || "Course"}
                        </h3>
                      </div>

                      <span className="badge badge-done">Certified</span>
                    </div>

                    <p className="text-xs text-white/60">
                      Certificate ID:{" "}
                      <span className="text-white/80">
                        {c.certificateId}
                      </span>
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-gold"
                      >
                        Download PDF
                      </a>

                      <span className="text-xs text-white/55">
                        Official course completion proof
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Components ---------- */

function SummaryCard({ label, value }) {
  return (
    <div className="glass rounded-3xl p-5 border border-white/10">
      <p className="text-xs text-white/60">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-gold">{value}</p>
    </div>
  );
}
