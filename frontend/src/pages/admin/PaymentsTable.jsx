import { useEffect, useMemo, useState } from "react";
import Loader from "../../components/Loader";
import { adminEnrollmentPaymentsTable } from "../../services/adminPaymentsService";

export default function PaymentsTable() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [activeKey, setActiveKey] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminEnrollmentPaymentsTable();
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const name = r.studentName || r.studentEmail || "Student";
      const email = r.studentEmail || "";
      const key = email || `${name}-unknown`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          name,
          email,
          total: 0,
          paid: 0,
          payments: [],
        });
      }

      const row = map.get(key);
      row.total += 1;
      if (String(r.paymentStatus || "").toLowerCase() === "captured") row.paid += 1;
      row.payments.push(r);
    }
    return Array.from(map.values());
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return grouped;
    return grouped.filter((g) =>
      `${g.name} ${g.email}`.toLowerCase().includes(q)
    );
  }, [grouped, query]);

  const active = useMemo(
    () => grouped.find((g) => g.key === activeKey) || null,
    [grouped, activeKey]
  );

  if (loading) return <Loader label="Loading Razorpay payments..." />;

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6 border border-white/10">
        <p className="text-xs tracking-[0.25em] text-white/60">
          ADMIN • PAYMENTS • RAZORPAY
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-extrabold">
          Razorpay Payments <span className="text-gold">Table</span>
        </h1>
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
                <th className="px-4 py-3">Enrollments</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">View</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-white/60" colSpan={5}>
                    No Razorpay payment rows found.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr
                    key={s.key}
                    className="border-t border-white/10 text-sm text-white/85"
                  >
                    <td className="px-4 py-3 font-semibold">{s.name}</td>
                    <td className="px-4 py-3">{s.email || "-"}</td>
                    <td className="px-4 py-3">{s.total}</td>
                    <td className="px-4 py-3">{s.paid}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setActiveKey(s.key)}
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

      {active && <Drawer student={active} onClose={() => setActiveKey(null)} />}
    </div>
  );
}

function Drawer({ student, onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-[1000] bg-black/65" onClick={onClose} />
      <aside className="fixed top-0 right-0 z-[1010] h-screen w-full max-w-2xl bg-[#090909] border-l border-white/10">
        <div className="h-full flex flex-col">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs tracking-[0.2em] text-white/60">STUDENT</p>
              <h2 className="text-xl font-extrabold mt-1 text-white">{student.name}</h2>
              <p className="text-sm text-white/70">{student.email || "-"}</p>
            </div>
            <button
              onClick={onClose}
              className="h-10 w-10 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-xl"
            >
              ×
            </button>
          </div>

          <div className="p-5 overflow-y-auto">
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[920px]">
                <thead className="bg-black/40">
                  <tr className="text-left text-sm text-white/70">
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Payment ID</th>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Paid At</th>
                  </tr>
                </thead>
                <tbody>
                  {student.payments.map((p, i) => (
                    <tr key={i} className="border-t border-white/10 text-sm text-white/85">
                      <td className="px-4 py-3">{p.courseTitle || "-"}</td>
                      <td className="px-4 py-3 text-gold">₹{Number(p.coursePrice || 0)}</td>
                      <td className="px-4 py-3">
                        <span className="text-white/80">
                          {p.paymentStatus || "unpaid"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/75">{p.paymentId || "-"}</td>
                      <td className="px-4 py-3 text-white/75">{p.orderId || "-"}</td>
                      <td className="px-4 py-3 text-white/65">
                        {p.paidAt ? new Date(p.paidAt).toLocaleString() : "-"}
                      </td>
                    </tr>
                  ))}
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
