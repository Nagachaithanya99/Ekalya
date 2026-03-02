import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiCopy, FiExternalLink, FiUploadCloud, FiX } from "react-icons/fi";
import { RiQrCodeLine } from "react-icons/ri";

import Loader from "../../components/Loader";
import { getCourseById } from "../../services/courseService";
import {
  createRazorpayOrder,
  getPaymentBill,
  verifyRazorpayPayment,
} from "../../services/razorpayService";
import { createPaymentRequest } from "../../services/paymentService";
import { uploadFileUrl } from "../../services/uploadService";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    const existing = document.getElementById("razorpay-js");
    if (existing) return resolve(true);

    const script = document.createElement("script");
    script.id = "razorpay-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const qrImage = import.meta.env.VITE_UPI_QR_IMAGE || "/images/upi-qr.jpeg";
const payeeName = import.meta.env.VITE_PAYEE_NAME || "Ekalya Learning Platform";
const payeeUpi = import.meta.env.VITE_UPI_ID || "yourupi@bank";
const initialBill = {
  baseAmount: 0,
  taxPercent: 18,
  taxAmount: 0,
  platformFee: 0,
  totalAmount: 0,
};

export default function PayEnroll() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const [bill, setBill] = useState(initialBill);

  const [openQr, setOpenQr] = useState(false);
  const [submittingManual, setSubmittingManual] = useState(false);
  const [file, setFile] = useState(null);
  const [utr, setUtr] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [cRes, bRes] = await Promise.all([
          getCourseById(courseId),
          getPaymentBill(courseId),
        ]);
        setCourse(cRes.data || null);
        setBill(bRes.data?.bill || initialBill);
      } catch (err) {
        console.error(err);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  const upiAmount = useMemo(
    () => Number(bill.totalAmount || course?.price || 0).toFixed(2),
    [bill.totalAmount, course?.price]
  );

  const upiPayUrl = useMemo(() => {
    const p = new URLSearchParams({
      pa: payeeUpi,
      pn: payeeName,
      am: upiAmount,
      cu: "INR",
      tn: `Course ${course?.title || ""}`,
    });
    return `upi://pay?${p.toString()}`;
  }, [course?.title, upiAmount]);

  const apps = useMemo(
    () => [
      { name: "PhonePe", href: upiPayUrl.replace("upi://pay", "phonepe://pay") },
      { name: "GPay", href: upiPayUrl.replace("upi://pay", "gpay://upi/pay") },
      { name: "Paytm", href: upiPayUrl.replace("upi://pay", "paytmmp://pay") },
      { name: "BHIM", href: upiPayUrl.replace("upi://pay", "bhim://pay") },
    ],
    [upiPayUrl]
  );

  const openUpiApp = (href) => {
    try {
      window.location.href = href;
      setTimeout(() => {
        window.location.href = upiPayUrl;
      }, 850);
    } catch {
      window.location.href = upiPayUrl;
    }
  };

  const copyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(payeeUpi);
      alert("UPI ID copied");
    } catch {
      alert("Copy failed");
    }
  };

  const payViaRazorpay = async () => {
    try {
      setPaying(true);

      const ok = await loadRazorpayScript();
      if (!ok) {
        alert("Razorpay SDK failed to load.");
        return;
      }

      const orderRes = await createRazorpayOrder(courseId);
      const d = orderRes.data;

      const rzp = new window.Razorpay({
        key: d.keyId,
        amount: d.amount,
        currency: d.currency,
        name: "Ekalya Learning Platform",
        description: d.course?.title || "Course Purchase",
        order_id: d.orderId,
        prefill: {
          name: d.user?.name || "",
          email: d.user?.email || "",
        },
        method: {
          upi: true,
          netbanking: true,
          card: true,
          wallet: true,
        },
        handler: async (resp) => {
          await verifyRazorpayPayment({ courseId, ...resp });
          alert("Payment successful. Redirecting to course...");
          navigate(`/student/watch/${courseId}`, { replace: true });
        },
        theme: { color: "#111827" },
      });

      rzp.on("payment.failed", (resp) => {
        alert(resp?.error?.description || "Payment failed");
      });

      rzp.open();
    } catch (err) {
      alert(err?.response?.data?.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const submitManualProof = async () => {
    try {
      if (!file) return alert("Upload screenshot required");
      setSubmittingManual(true);

      const screenshotUrl = await uploadFileUrl(file, "image");
      await createPaymentRequest({
        courseId,
        amount: Number(upiAmount),
        utr: utr.trim(),
        screenshotUrl,
        note: note.trim(),
      });

      alert("Payment proof submitted. Admin approval pending.");
      setOpenQr(false);
      navigate(`/courses/${courseId}`, { replace: true });
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || "Submit failed");
    } finally {
      setSubmittingManual(false);
    }
  };

  if (loading) return <Loader label="Loading payment page..." />;
  if (!course) return <div className="text-white/70">Course not found.</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="glass rounded-3xl p-6 border border-white/10">
        <h1 className="text-2xl font-extrabold">Pay & Enroll</h1>
        <p className="text-white/70 mt-1">{course.title}</p>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="glass rounded-3xl p-6 border border-white/10 space-y-5">
          <h2 className="text-lg font-bold">Choose Payment Method</h2>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-semibold">1) Instant Online Payment (Recommended)</p>
            <p className="text-xs text-white/65 mt-1">
              Real payment verification. On success you are auto-enrolled and redirected.
            </p>
            <button
              onClick={payViaRazorpay}
              disabled={paying}
              className="mt-3 w-full px-4 py-3 rounded-xl bg-[#f7d774] text-black font-extrabold disabled:opacity-60"
            >
              {paying ? "Opening Razorpay..." : `Pay ₹${upiAmount} with Razorpay`}
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-semibold">2) UPI App Redirect (PhonePe / GPay / Paytm)</p>
            <p className="text-xs text-white/65 mt-1">
              Amount is prefilled. After payment, submit proof for admin approval.
            </p>

            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              {apps.map((a) => (
                <button
                  key={a.name}
                  onClick={() => openUpiApp(a.href)}
                  className="px-4 py-3 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 text-left font-semibold"
                >
                  {a.name} <FiExternalLink className="inline ml-2" />
                </button>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={copyUpiId}
                className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-sm"
              >
                <FiCopy className="inline mr-1" />
                Copy UPI ID
              </button>
              <button
                onClick={() => setOpenQr(true)}
                className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-sm"
              >
                <RiQrCodeLine className="inline mr-1" />
                QR + Submit Proof
              </button>
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 border border-white/10">
          <h2 className="text-lg font-bold">Payment Bill</h2>
          <div className="mt-4 space-y-3 text-sm">
            <Row label="Course Price" value={`₹${Number(bill.baseAmount || 0).toFixed(2)}`} />
            <Row
              label={`Tax (${Number(bill.taxPercent || 0)}%)`}
              value={`₹${Number(bill.taxAmount || 0).toFixed(2)}`}
            />
            <Row label="Platform Fee" value={`₹${Number(bill.platformFee || 0).toFixed(2)}`} />
            <div className="border-t border-white/10 pt-3">
              <Row label="Total Payable" value={`₹${Number(upiAmount).toFixed(2)}`} strong />
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-white/5 border border-white/10 p-4 text-xs text-white/65">
            <p>Payee: {payeeName}</p>
            <p>UPI ID: {payeeUpi}</p>
            <p className="mt-1">
              For automatic enrollment use Razorpay. UPI app/QR proof payments are approved by admin.
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {openQr && (
          <motion.div
            className="fixed inset-0 z-[999] bg-black/70 p-4 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpenQr(false)}
          >
            <motion.div
              className="w-full max-w-3xl glass rounded-3xl p-6 border border-white/10"
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 10, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-extrabold">UPI QR Payment</h3>
                <button
                  onClick={() => setOpenQr(false)}
                  className="p-2 rounded-xl bg-white/10 border border-white/10"
                >
                  <FiX />
                </button>
              </div>

              <div className="mt-5 grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/80 font-semibold">
                    Scan & Pay ₹{upiAmount}
                  </p>
                  <div className="mt-3 flex justify-center">
                    <img
                      src={qrImage}
                      alt="UPI QR"
                      className="w-56 h-56 object-contain rounded-2xl border border-white/10 bg-black/30"
                    />
                  </div>
                  <p className="mt-3 text-xs text-white/60">
                    UPI ID: <span className="text-white/85">{payeeUpi}</span>
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <label className="text-xs text-white/70">UTR (optional)</label>
                  <input
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    className="mt-2 w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10"
                  />

                  <label className="mt-4 block text-xs text-white/70">
                    Screenshot *
                  </label>
                  <label className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/10 cursor-pointer">
                    <FiUploadCloud />
                    <span className="text-sm">Choose File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  <p className="mt-2 text-xs text-white/60">{file?.name || "No file selected"}</p>

                  <label className="mt-4 block text-xs text-white/70">Note</label>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="mt-2 w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10"
                  />

                  <button
                    onClick={submitManualProof}
                    disabled={submittingManual}
                    className="mt-5 w-full px-5 py-3 rounded-xl bg-white/10 border border-white/10 disabled:opacity-60 font-bold"
                  >
                    {submittingManual ? "Submitting..." : "Submit Payment Proof"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/70">{label}</span>
      <span className={strong ? "font-extrabold text-gold" : "text-white/85"}>{value}</span>
    </div>
  );
}
