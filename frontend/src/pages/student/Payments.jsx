import { useEffect, useState } from "react";
import Loader from "../../components/Loader";
import { getMyPaymentHistory } from "../../services/razorpayService";

export default function StudentPayments() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getMyPaymentHistory();
        setRows(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Loader label="Loading payments..." />;

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6 border border-white/10">
        <p className="text-xs tracking-[0.25em] text-white/60">
          STUDENT • PAYMENTS • HISTORY
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-extrabold">
          My <span className="text-gold">Payments</span>
        </h1>
      </div>

      <div className="glass rounded-3xl p-5 border border-white/10 overflow-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="text-white/70">
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-3">Date</th>
              <th className="text-left py-3 px-3">Course</th>
              <th className="text-left py-3 px-3">Mode</th>
              <th className="text-left py-3 px-3">Status</th>
              <th className="text-left py-3 px-3">Base</th>
              <th className="text-left py-3 px-3">Tax</th>
              <th className="text-left py-3 px-3">Fee</th>
              <th className="text-left py-3 px-3">Amount</th>
              <th className="text-left py-3 px-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-6 px-3 text-white/60">
                  No payment records found.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={`${r.mode}-${r._id}`} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-3 text-white/70">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}
                  </td>
                  <td className="py-3 px-3">{r.course?.title || "-"}</td>
                  <td className="py-3 px-3 uppercase text-xs">{r.mode}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs ${
                        String(r.status).toLowerCase() === "paid" ||
                        String(r.status).toLowerCase() === "approved"
                          ? "bg-green-500/20 text-green-300"
                          : String(r.status).toLowerCase() === "rejected"
                          ? "bg-red-500/20 text-red-300"
                          : "bg-yellow-500/20 text-yellow-200"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-white/70">
                    ₹{Number(r.baseAmount ?? r.course?.price ?? r.amount ?? 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-white/70">
                    ₹{Number(r.taxAmount || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-white/70">
                    ₹{Number(r.platformFee || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-gold">₹{Number(r.amount || 0).toFixed(2)}</td>
                  <td className="py-3 px-3 text-white/70">
                    {r.mode === "razorpay" ? (
                      <span>Payment ID: {r.paymentId || "-"}</span>
                    ) : (
                      <span>UTR: {r.utr || "-"}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
