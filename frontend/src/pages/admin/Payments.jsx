import { useEffect, useMemo, useState } from "react";
import Loader from "../../components/Loader";
import {
  adminGetPaymentRequests,
  adminApprovePayment,
  adminRejectPayment,
} from "../../services/paymentService";

export default function Payments() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [activeKey, setActiveKey] = useState(null);
  const [actingId, setActingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminGetPaymentRequests();
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const p of items) {
      const name = p.userId?.name || p.userId?.email || "Student";
      const email = p.userId?.email || "";
      const key = email || String(p.userId?._id || p._id);

      if (!map.has(key)) {
        map.set(key, {
          key,
          name,
          email,
          total: 0,
          pending: 0,
          requests: [],
        });
      }

      const row = map.get(key);
      row.total += 1;
      if (String(p.status).toLowerCase() === "pending") row.pending += 1;
      row.requests.push(p);
    }
    return Array.from(map.values());
  }, [items]);

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

  const approve = async (id) => {
    try {
      setActingId(id);
      await adminApprovePayment(id);
      await load();
    } catch (err) {
      console.error(err);
      alert("Failed to approve request");
    } finally {
      setActingId(null);
    }
  };

  const notApprove = async (id) => {
    const note = prompt("Reason (optional)?") || "";
    try {
      setActingId(id);
      await adminRejectPayment(id, note);
      await load();
    } catch (err) {
      console.error(err);
      alert("Failed to reject request");
    } finally {
      setActingId(null);
    }
  };

  if (loading) return <Loader label="Loading payment requests..." />;

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6 border border-white/10">
        <p className="text-xs tracking-[0.25em] text-white/60">
          ADMIN • PAYMENTS • REQUESTS
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-extrabold">
          Payment Requests <span className="text-gold">Table</span>
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
                <th className="px-4 py-3">Requests</th>
                <th className="px-4 py-3">Pending</th>
                <th className="px-4 py-3">View</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-white/60" colSpan={5}>
                    No payment requests found.
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
                    <td className="px-4 py-3">{s.pending}</td>
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

      {active && (
        <Drawer
          student={active}
          actingId={actingId}
          onApprove={approve}
          onNotApprove={notApprove}
          onClose={() => setActiveKey(null)}
        />
      )}
    </div>
  );
}

function Drawer({ student, actingId, onApprove, onNotApprove, onClose }) {
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
              <table className="w-full min-w-[900px]">
                <thead className="bg-black/40">
                  <tr className="text-left text-sm text-white/70">
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">UTR</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Proof</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {student.requests.map((p) => {
                    const status = String(p.status || "").toLowerCase();
                    return (
                      <tr key={p._id} className="border-t border-white/10 text-sm text-white/85">
                        <td className="px-4 py-3">{p.courseId?.title || "Course"}</td>
                        <td className="px-4 py-3 text-gold">₹{Number(p.amount || 0)}</td>
                        <td className="px-4 py-3">{p.utr || "-"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              status === "approved"
                                ? "text-green-400"
                                : status === "rejected"
                                ? "text-red-400"
                                : "text-yellow-300"
                            }
                          >
                            {status || "pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {p.screenshotUrl ? (
                            <a
                              href={p.screenshotUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-gold underline"
                            >
                              View
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {status === "pending" ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => onApprove(p._id)}
                                disabled={actingId === p._id}
                                className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 disabled:opacity-60"
                              >
                                {actingId === p._id ? "..." : "Approve"}
                              </button>
                              <button
                                onClick={() => onNotApprove(p._id)}
                                disabled={actingId === p._id}
                                className="px-3 py-1.5 rounded-lg bg-red-500/85 text-white disabled:opacity-60"
                              >
                                {actingId === p._id ? "..." : "Not Approve"}
                              </button>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
