import { useEffect, useMemo, useState } from "react";
import Loader from "../../components/Loader";
import {
  getCertificatesDirectoryAdmin,
  publishCertificate,
  unpublishCertificate,
} from "../../services/certificateService";

export default function CertificatesAdmin() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [actingCertId, setActingCertId] = useState(null);

  const load = async () => {
    const res = await getCertificatesDirectoryAdmin();
    setRows(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch (err) {
        console.error(err);
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => `${r.name} ${r.email}`.toLowerCase().includes(q));
  }, [rows, query]);

  const activeStudent = useMemo(
    () => rows.find((r) => r._id === activeStudentId) || null,
    [rows, activeStudentId]
  );

  const togglePublish = async (cert) => {
    try {
      setActingCertId(cert._id);
      if (cert.published) await unpublishCertificate(cert._id);
      else await publishCertificate(cert._id);
      await load();
    } catch (err) {
      console.error(err);
      alert("Failed to update certificate status");
    } finally {
      setActingCertId(null);
    }
  };

  if (loading) return <Loader label="Loading certificates..." />;

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6 border border-white/10">
        <p className="text-xs tracking-[0.25em] text-white/60">
          ADMIN • CERTIFICATES • DIRECTORY
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-extrabold">
          Certificates <span className="text-gold">Table</span>
        </h1>
        <p className="mt-2 text-white/70">
          Manage student certificates and control publish/unpublish state.
        </p>
      </div>

      <div className="glass rounded-3xl p-6 border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by student name or email"
            className="w-full md:max-w-md px-4 py-3 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-[#f7d774]/40"
          />
          <p className="text-sm text-white/60">
            Total Students:{" "}
            <span className="text-white font-semibold">{filtered.length}</span>
          </p>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[760px]">
            <thead className="bg-black/40">
              <tr className="text-left text-sm text-white/70">
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Certificates</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">View</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-white/60" colSpan={5}>
                    No certificate records found.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr
                    key={s._id}
                    className="border-t border-white/10 text-sm text-white/85"
                  >
                    <td className="px-4 py-3 font-semibold">{s.name}</td>
                    <td className="px-4 py-3">{s.email || "-"}</td>
                    <td className="px-4 py-3">{s.totalCertificates || 0}</td>
                    <td className="px-4 py-3">{s.publishedCertificates || 0}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setActiveStudentId(s._id)}
                        className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeStudent && (
        <CertificatesDrawer
          student={activeStudent}
          actingCertId={actingCertId}
          onTogglePublish={togglePublish}
          onClose={() => setActiveStudentId(null)}
        />
      )}
    </div>
  );
}

function CertificatesDrawer({
  student,
  actingCertId,
  onTogglePublish,
  onClose,
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-[1000] bg-black/65"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="fixed top-0 right-0 z-[1010] h-screen w-full max-w-2xl bg-[#090909] border-l border-white/10 shadow-2xl">
        <div className="h-full flex flex-col">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs tracking-[0.2em] text-white/60">STUDENT</p>
              <h2 className="text-xl font-extrabold mt-1 text-white">
                {student.name}
              </h2>
              <p className="text-sm text-white/70">{student.email || "-"}</p>
            </div>
            <button
              onClick={onClose}
              className="h-10 w-10 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-xl"
              aria-label="Close drawer"
            >
              ×
            </button>
          </div>

          <div className="p-5 overflow-y-auto">
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[780px]">
                <thead className="bg-black/40">
                  <tr className="text-left text-sm text-white/70">
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3">Certificate ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {!student.certificates?.length ? (
                    <tr>
                      <td className="px-4 py-6 text-white/60" colSpan={4}>
                        No certificates found for this student.
                      </td>
                    </tr>
                  ) : (
                    student.certificates.map((c) => (
                      <tr
                        key={c._id}
                        className="border-t border-white/10 text-sm text-white/85"
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold">{c.course?.title || "Course"}</p>
                          <p className="text-xs text-white/55">
                            {c.course?.category || "General"} •{" "}
                            {c.course?.level || "Beginner"}
                          </p>
                        </td>
                        <td className="px-4 py-3">{c.certificateId}</td>
                        <td className="px-4 py-3">
                          {c.published ? (
                            <span className="text-green-400">Published</span>
                          ) : (
                            <span className="text-yellow-300">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => onTogglePublish(c)}
                            disabled={actingCertId === c._id}
                            className={`px-3 py-2 rounded-xl font-semibold border disabled:opacity-60 ${
                              c.published
                                ? "bg-red-500/90 hover:bg-red-500 text-white border-red-400/30"
                                : "bg-[#f7d774] hover:opacity-90 text-black border-[#f7d774]"
                            }`}
                          >
                            {actingCertId === c._id
                              ? "Updating..."
                              : c.published
                              ? "Unpublish"
                              : "Publish"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="px-5 py-4 border-t border-white/10">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 hover:bg-white/15 font-semibold text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
